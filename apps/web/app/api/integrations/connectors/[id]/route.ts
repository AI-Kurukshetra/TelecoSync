import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("integration_connectors")
      .select("id, name, connector_type, direction, system_type, config_json, enabled, last_run_at, last_run_status, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Connector not found.");
    return ok(
      tmfEnvelope("IntegrationConnector", {
        id: data.id,
        href: tmfHref("admin/integrations/connectors", data.id),
        name: data.name,
        connectorType: data.connector_type,
        direction: data.direction,
        systemType: data.system_type,
        enabled: data.enabled,
        status: data.last_run_status,
        lastRunAt: data.last_run_at,
        config: data.config_json
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
