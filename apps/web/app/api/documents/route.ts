import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { assertPermission } from "@/lib/api/auth-guard";
import { isCustomerSession } from "@/lib/auth/customer-access";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { documentSchema } from "@/lib/utils/zod-schemas/admin";
import { recordDomainEvent } from "@/lib/api/events";

const documentsBucket = process.env.SUPABASE_DOCUMENTS_BUCKET ?? "documents";

async function getSignedDocumentUrl(path: string) {
  const supabase = adminTenantClient();
  const { data } = await supabase.storage
    .from(documentsBucket)
    .createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}

export async function GET() {
  try {
    const session = await requireSessionContext();
    if (!isCustomerSession(session) && session.role !== "admin") {
      assertPermission(session.permissions, "admin:read");
    }
    const supabase = adminTenantClient();
    let query = supabase
      .from("documents")
      .select("id, entity_type, entity_id, name, storage_path, mime_type, size_bytes, uploaded_by, created_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (isCustomerSession(session) && session.customerId) {
      query = query.eq("entity_type", "customer").eq("entity_id", session.customerId);
    }

    const { data, error } = await query;

    if (error) return apiError("INTERNAL_ERROR", error.message);

    const rows = await Promise.all(
      (data ?? []).map(async (document) => ({
        ...document,
        download_url: await getSignedDocumentUrl(document.storage_path)
      }))
    );

    return ok(rows);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("admin:write");
    const supabase = adminTenantClient();
    let payload:
      | {
          entityType?: string;
          entityId?: string;
          name: string;
          storagePath: string;
          mimeType?: string;
          sizeBytes?: number;
        }
      | null = null;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return apiError("VALIDATION_ERROR", "A document file is required.");
      }

      const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storagePath = `${session.tenantId}/${Date.now()}-${fileName}`;
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(documentsBucket)
        .upload(storagePath, arrayBuffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false
        });

      if (uploadError) {
        return apiError("INTERNAL_ERROR", uploadError.message);
      }

      payload = {
        entityType: String(formData.get("entityType") ?? "") || undefined,
        entityId: String(formData.get("entityId") ?? "") || undefined,
        name: String(formData.get("name") ?? file.name),
        storagePath,
        mimeType: file.type || undefined,
        sizeBytes: file.size
      };
    } else {
      const json = await request.json().catch(() => null);
      const result = documentSchema.safeParse(json);

      if (!result.success || !result.data.storagePath) {
        return apiError("VALIDATION_ERROR", "Invalid document payload.");
      }

      payload = {
        entityType: result.data.entityType,
        entityId: result.data.entityId,
        name: result.data.name,
        storagePath: result.data.storagePath,
        mimeType: result.data.mimeType,
        sizeBytes: result.data.sizeBytes
      };
    }

    if (!payload) {
      return apiError("VALIDATION_ERROR", "Invalid document payload.");
    }

    const { data, error } = await supabase
      .from("documents")
      .insert(
        withTenantScope(session, {
          entity_type: payload.entityType ?? null,
          entity_id: payload.entityId ?? null,
          name: payload.name,
          storage_path: payload.storagePath,
          mime_type: payload.mimeType ?? null,
          size_bytes: payload.sizeBytes ?? null,
          uploaded_by: session.userId
        })
      )
      .select("id, name, storage_path, mime_type, size_bytes")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create document.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "document.created",
      entityType: "document",
      entityId: data.id,
      payload: data
    });

    return created({
      ...data,
      download_url: await getSignedDocumentUrl(data.storage_path)
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
