import { ok } from "@/lib/api/response";
import { created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { assetSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("operations:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("assets")
      .select("id, name, asset_type, status, location_id, assigned_to, metadata_json", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? [], paginationMeta(pagination, count));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("operations:write");
    const json = await request.json().catch(() => null);
    const result = assetSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid asset payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("assets")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          asset_type: result.data.assetType ?? null,
          status: result.data.status,
          location_id: result.data.locationId ?? null,
          assigned_to: result.data.assignedTo ?? null,
          metadata_json: result.data.metadata
        })
      )
      .select("id, name, asset_type, status, location_id, assigned_to, metadata_json")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create asset.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "asset.created",
      entityType: "asset",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
