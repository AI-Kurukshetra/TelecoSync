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
      .from("workflow_instances")
      .select("id, workflow_id, entity_type, entity_id, current_step, status, started_at, completed_at")
      .eq("tenant_id", session.tenantId)
      .eq("workflow_id", params.id)
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}
