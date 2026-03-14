import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfService } from "@/lib/integrations/tmf";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:write");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("service_instances")
      .update({
        status: "active",
        activated_at: new Date().toISOString()
      })
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, status, activated_at")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Service instance not found.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "service.provisioned",
      entityType: "service_instance",
      entityId: data.id,
      payload: data
    });

    return ok(
      tmfService({
        id: data.id,
        status: data.status,
        activatedAt: data.activated_at
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
