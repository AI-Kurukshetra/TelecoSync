import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { workflowSchema } from "@/lib/utils/zod-schemas/admin";
import { recordDomainEvent } from "@/lib/api/events";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("admin:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("workflows")
      .select("id, name, trigger_type, steps_json, status, version, created_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        triggerType: workflow.trigger_type,
        steps: workflow.steps_json,
        status: workflow.status,
        version: workflow.version
      })),
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
    const result = workflowSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid workflow payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("workflows")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          trigger_type: result.data.triggerType,
          steps_json: result.data.steps,
          status: result.data.status
        })
      )
      .select("id, name, trigger_type, steps_json, status, version")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create workflow.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "workflow.created",
      entityType: "workflow",
      entityId: data.id,
      payload: data
    });

    return created({
      id: data.id,
      name: data.name,
      triggerType: data.trigger_type,
      steps: data.steps_json,
      status: data.status,
      version: data.version
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
