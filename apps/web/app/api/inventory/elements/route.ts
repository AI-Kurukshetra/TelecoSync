import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { networkElementSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfResource } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("operations:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("network_elements")
      .select("id, name, type, vendor_id, model, serial_number, ip_address, location_id, status, commissioned_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((resource) => ({
        ...tmfResource({
          id: resource.id,
          name: resource.name,
          type: resource.type,
          status: resource.status,
          model: resource.model,
          serialNumber: resource.serial_number,
          ipAddress: resource.ip_address
        }),
        name: resource.name,
        type: resource.type,
        status: resource.status,
        model: resource.model,
        serial_number: resource.serial_number,
        ip_address: resource.ip_address,
        location_id: resource.location_id,
        vendor_id: resource.vendor_id,
        commissioned_at: resource.commissioned_at
      })),
      paginationMeta(pagination, count)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("operations:write");
    const json = await request.json().catch(() => null);
    const result = networkElementSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid network element payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("network_elements")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          type: result.data.type,
          vendor_id: result.data.vendorId ?? null,
          model: result.data.model ?? null,
          serial_number: result.data.serialNumber ?? null,
          ip_address: result.data.ipAddress ?? null,
          location_id: result.data.locationId ?? null,
          status: result.data.status
        })
      )
      .select("id, name, type, status")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create network element.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "network_element.created",
      entityType: "network_element",
      entityId: data.id,
      payload: data
    });

    return created({
      ...tmfResource({
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status
      }),
      name: data.name,
      type: data.type,
      status: data.status
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
