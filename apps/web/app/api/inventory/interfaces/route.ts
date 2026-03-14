import { ok } from "@/lib/api/response";
import { created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { networkInterfaceSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("operations:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("network_interfaces")
      .select("id, network_element_id, interface_name, type, bandwidth_mbps, status", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? [], paginationMeta(pagination, count));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("operations:write");
    const json = await request.json().catch(() => null);
    const result = networkInterfaceSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid interface payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("network_interfaces")
      .insert(
        withTenantScope(session, {
          network_element_id: result.data.networkElementId,
          interface_name: result.data.interfaceName,
          type: result.data.type ?? null,
          bandwidth_mbps: result.data.bandwidthMbps ?? null,
          status: result.data.status
        })
      )
      .select("id, network_element_id, interface_name, type, bandwidth_mbps, status")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create interface.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "network_interface.created",
      entityType: "network_interface",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
