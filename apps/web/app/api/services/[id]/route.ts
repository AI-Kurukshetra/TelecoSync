import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { serviceInstanceSchema } from "@/lib/utils/zod-schemas/oss";
import { tmfService } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("service_instances")
      .select("id, customer_id, product_id, network_element_id, status, activated_at, deactivated_at, config_json, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Service instance not found.");
    return ok(
      tmfService({
        id: data.id,
        customerId: data.customer_id,
        productId: data.product_id,
        networkElementId: data.network_element_id,
        status: data.status,
        activatedAt: data.activated_at,
        deactivatedAt: data.deactivated_at,
        config: data.config_json
      })
    );
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
    const result = serviceInstanceSchema.partial().safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid service update payload.");

    const updates: Record<string, unknown> = {};
    if (result.data.customerId !== undefined) updates.customer_id = result.data.customerId;
    if (result.data.productId !== undefined) updates.product_id = result.data.productId;
    if (result.data.networkElementId !== undefined) updates.network_element_id = result.data.networkElementId;
    if (result.data.status !== undefined) updates.status = result.data.status;
    if (result.data.config !== undefined) updates.config_json = result.data.config;

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("service_instances")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, status, config_json")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Service instance not found.");
    return ok(
      tmfService({
        id: data.id,
        status: data.status,
        config: data.config_json
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
