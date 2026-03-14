import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfSla } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("slas")
      .select("id, name, metric_type, target_value, measurement_window, penalty_json, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "SLA not found.");
    return ok(
      tmfSla({
        id: data.id,
        name: data.name,
        metricType: data.metric_type,
        targetValue: data.target_value,
        measurementWindow: data.measurement_window,
        penalty: data.penalty_json
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
