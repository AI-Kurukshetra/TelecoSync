import { created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { recordDomainEvent } from "@/lib/api/events";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:write");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("connector_executions")
      .insert(
        withTenantScope(session, {
          connector_id: params.id,
          trigger_type: "manual",
          status: "queued",
          request_json: {},
          response_json: {}
        })
      )
      .select("id, connector_id, trigger_type, status, started_at")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to queue connector execution.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "connector.execution.queued",
      entityType: "connector_execution",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
