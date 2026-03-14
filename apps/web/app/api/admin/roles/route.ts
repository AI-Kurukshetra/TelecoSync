import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { roleSchema } from "@/lib/utils/zod-schemas/admin";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("admin:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("roles")
      .select("id, name, permissions_json, created_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((role) =>
        tmfEnvelope("PermissionSet", {
          id: role.id,
          href: tmfHref("admin/roles", role.id),
          name: role.name,
          permissions: role.permissions_json
        })
      ),
      paginationMeta(pagination, count)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("admin:write");
    const json = await request.json().catch(() => null);
    const result = roleSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid role payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("roles")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          permissions_json: result.data.permissions
        })
      )
      .select("id, name, permissions_json")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create role.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "role.created",
      entityType: "role",
      entityId: data.id,
      payload: data
    });

    return created(
      tmfEnvelope("PermissionSet", {
        id: data.id,
        href: tmfHref("admin/roles", data.id),
        name: data.name,
        permissions: data.permissions_json
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
