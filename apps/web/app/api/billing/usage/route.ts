import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { assertCustomerContext, isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";

export async function GET() {
  try {
    const session = await requireSessionContext("billing:read");
    const supabase = adminTenantClient();
    let query = supabase
      .from("usage_records")
      .select("id, account_id, service_instance_id, usage_type, quantity, unit, rated_amount, recorded_at")
      .eq("tenant_id", session.tenantId)
      .order("recorded_at", { ascending: false })
      .limit(100);

    if (isCustomerSession(session)) {
      assertCustomerContext(session);
      query = query.eq("account_id", session.accountId!);
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
