import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { networkElementSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfResource } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("network_elements")
      .select("id, name, type, vendor_id, model, serial_number, ip_address, location_id, status, commissioned_at, metadata_json")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Network element not found.");
    return ok({
      ...tmfResource({
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        model: data.model,
        serialNumber: data.serial_number,
        ipAddress: data.ip_address,
        characteristics: data.metadata_json
      }),
      name: data.name,
      type: data.type,
      status: data.status,
      model: data.model,
      serial_number: data.serial_number,
      ip_address: data.ip_address,
      location_id: data.location_id,
      vendor_id: data.vendor_id,
      commissioned_at: data.commissioned_at,
      metadata_json: data.metadata_json
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
    const session = await requireSessionContext("operations:write");
    const json = await request.json().catch(() => null);
    const result = networkElementSchema.partial().safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid network element update payload.");

    const updates: Record<string, unknown> = {};
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.type !== undefined) updates.type = result.data.type;
    if (result.data.vendorId !== undefined) updates.vendor_id = result.data.vendorId;
    if (result.data.model !== undefined) updates.model = result.data.model;
    if (result.data.serialNumber !== undefined) updates.serial_number = result.data.serialNumber;
    if (result.data.ipAddress !== undefined) updates.ip_address = result.data.ipAddress;
    if (result.data.locationId !== undefined) updates.location_id = result.data.locationId;
    if (result.data.status !== undefined) updates.status = result.data.status;

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("network_elements")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, name, type, status, metadata_json")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Network element not found.");
    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "network_element.updated",
      entityType: "network_element",
      entityId: data.id,
      payload: data
    });

    return ok({
      ...tmfResource({
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        characteristics: data.metadata_json
      }),
      name: data.name,
      type: data.type,
      status: data.status,
      metadata_json: data.metadata_json
    });
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
      .from("network_elements")
      .delete()
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Network element not found.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "network_element.deleted",
      entityType: "network_element",
      entityId: data.id,
      payload: { id: data.id }
    });

    return ok({ id: data.id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
