import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { assertCustomerContext, assertCustomerOwnsCustomer, isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("customers:read");
    assertCustomerOwnsCustomer(session, params.id);
    const supabase = adminTenantClient();
    let query = supabase
      .from("orders")
      .select("id, customer_id, order_type, status, order_number, total_amount, currency")
      .eq("tenant_id", session.tenantId)
      .eq("customer_id", params.id)
      .order("created_at", { ascending: false });

    if (isCustomerSession(session)) {
      assertCustomerContext(session);
      query = query.eq("customer_id", session.customerId!);
    }

    const { data, error } = await query;

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}
