import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";

export async function GET() {
  try {
    const session = await requireSessionContext("billing:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("rating_rules")
      .select("id, product_id, rule_type, condition_json, rate, currency, priority")
      .eq("tenant_id", session.tenantId)
      .order("priority", { ascending: false });

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}
