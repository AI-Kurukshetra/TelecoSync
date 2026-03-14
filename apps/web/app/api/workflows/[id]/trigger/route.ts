import { created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { recordDomainEvent } from "@/lib/api/events";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:write");
    const json = await request.json().catch(() => null);
    const entityType =
      typeof json?.entityType === "string" && json.entityType.length > 0
        ? json.entityType
        : "manual";
    const entityId =
      typeof json?.entityId === "string" && json.entityId.length > 0
        ? json.entityId
        : crypto.randomUUID();
    const state =
      json && typeof json.state === "object" && json.state !== null
        ? json.state
        : {};
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("workflow_instances")
      .insert(
        withTenantScope(session, {
          workflow_id: params.id,
          entity_type: entityType,
          entity_id: entityId,
          current_step: 0,
          state_json: state,
          status: "running"
        })
      )
      .select("id, workflow_id, entity_type, entity_id, status, current_step, state_json")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to trigger workflow.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "workflow.triggered",
      entityType: "workflow_instance",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
