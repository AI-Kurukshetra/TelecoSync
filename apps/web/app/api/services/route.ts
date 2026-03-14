import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { serviceInstanceSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfService } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("operations:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("service_instances")
      .select("id, customer_id, product_id, network_element_id, status, activated_at, deactivated_at, config_json, created_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((service) =>
        tmfService({
          id: service.id,
          customerId: service.customer_id,
          productId: service.product_id,
          networkElementId: service.network_element_id,
          status: service.status,
          activatedAt: service.activated_at,
          deactivatedAt: service.deactivated_at,
          config: service.config_json
        })
      ),
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
    const result = serviceInstanceSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid service payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("service_instances")
      .insert(
        withTenantScope(session, {
          customer_id: result.data.customerId ?? null,
          product_id: result.data.productId ?? null,
          network_element_id: result.data.networkElementId ?? null,
          status: result.data.status,
          config_json: result.data.config
        })
      )
      .select("id, customer_id, product_id, network_element_id, status, config_json")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create service instance.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "service.created",
      entityType: "service_instance",
      entityId: data.id,
      payload: data
    });

    return created(
      tmfService({
        id: data.id,
        customerId: data.customer_id,
        productId: data.product_id,
        networkElementId: data.network_element_id,
        status: data.status,
        config: data.config_json
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
