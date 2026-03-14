import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("webhook_deliveries")
      .select("id, event_type, http_status, status, attempt_number, delivered_at, response_body")
      .eq("tenant_id", session.tenantId)
      .eq("subscription_id", params.id)
      .order("delivered_at", { ascending: false })
      .limit(50);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}
