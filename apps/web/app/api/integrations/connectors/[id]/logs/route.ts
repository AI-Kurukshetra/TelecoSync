import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("connector_executions")
      .select("id, connector_id, trigger_type, status, request_json, response_json, error_message, duration_ms, started_at, completed_at")
      .eq("tenant_id", session.tenantId)
      .eq("connector_id", params.id)
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}
