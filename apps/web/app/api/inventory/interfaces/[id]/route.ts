import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { networkInterfaceSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:write");
    const json = await request.json().catch(() => null);
    const result = networkInterfaceSchema.partial().safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid interface update payload.");

    const updates: Record<string, unknown> = {};
    if (result.data.networkElementId !== undefined) updates.network_element_id = result.data.networkElementId;
    if (result.data.interfaceName !== undefined) updates.interface_name = result.data.interfaceName;
    if (result.data.type !== undefined) updates.type = result.data.type;
    if (result.data.bandwidthMbps !== undefined) updates.bandwidth_mbps = result.data.bandwidthMbps;
    if (result.data.status !== undefined) updates.status = result.data.status;

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("network_interfaces")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, network_element_id, interface_name, type, bandwidth_mbps, status")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Interface not found.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "network_interface.updated",
      entityType: "network_interface",
      entityId: data.id,
      payload: data
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:write");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("network_interfaces")
      .delete()
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Interface not found.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "network_interface.deleted",
      entityType: "network_interface",
      entityId: data.id,
      payload: { id: data.id }
    });

    return ok({ id: data.id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
