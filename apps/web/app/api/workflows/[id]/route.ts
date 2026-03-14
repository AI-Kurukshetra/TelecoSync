import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { workflowSchema } from "@/lib/utils/zod-schemas/admin";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("id, name, trigger_type, steps_json, status, version, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Workflow not found.");
    return ok({
      id: data.id,
      name: data.name,
      triggerType: data.trigger_type,
      steps: data.steps_json,
      status: data.status,
      version: data.version,
      createdAt: data.created_at
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:write");
    const json = await request.json().catch(() => null);
    const result = workflowSchema.partial().safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid workflow update payload.");

    const updates: Record<string, unknown> = {};
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.triggerType !== undefined) updates.trigger_type = result.data.triggerType;
    if (result.data.steps !== undefined) updates.steps_json = result.data.steps;
    if (result.data.status !== undefined) updates.status = result.data.status;

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("workflows")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, name, trigger_type, steps_json, status, version, created_at")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Workflow not found.");
    return ok({
      id: data.id,
      name: data.name,
      triggerType: data.trigger_type,
      steps: data.steps_json,
      status: data.status,
      version: data.version,
      createdAt: data.created_at
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
