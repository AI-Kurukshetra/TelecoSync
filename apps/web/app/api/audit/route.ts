import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("admin:read");
    const pagination = parsePagination(request, {
      defaultLimit: 50,
      maxLimit: 200
    });
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("audit_logs")
      .select("id, user_id, action, entity_type, entity_id, created_at", {
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
