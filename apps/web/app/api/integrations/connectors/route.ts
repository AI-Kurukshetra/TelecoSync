import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { connectorSchema } from "@/lib/utils/zod-schemas/integration";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("admin:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("integration_connectors")
      .select("id, name, connector_type, direction, system_type, enabled, last_run_at, last_run_status, created_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((connector) =>
        tmfEnvelope("IntegrationConnector", {
          id: connector.id,
          href: tmfHref("admin/integrations/connectors", connector.id),
          name: connector.name,
          connectorType: connector.connector_type,
          direction: connector.direction,
          systemType: connector.system_type,
          enabled: connector.enabled,
          status: connector.last_run_status,
          lastRunAt: connector.last_run_at
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
    const result = connectorSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid connector payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("integration_connectors")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          connector_type: result.data.connectorType,
          direction: result.data.direction,
          system_type: result.data.systemType,
          config_json: result.data.config,
          enabled: result.data.enabled ?? true
        })
      )
      .select("id, name, connector_type, direction, system_type, enabled")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create connector.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "connector.created",
      entityType: "integration_connector",
      entityId: data.id,
      payload: data
    });

    return created(
      tmfEnvelope("IntegrationConnector", {
        id: data.id,
        href: tmfHref("admin/integrations/connectors", data.id),
        name: data.name,
        connectorType: data.connector_type,
        direction: data.direction,
        systemType: data.system_type,
        enabled: data.enabled
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
