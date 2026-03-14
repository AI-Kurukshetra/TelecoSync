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
    const session = await requireSessionContext("billing:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("promotions")
      .select("id, product_id, name, discount_type, discount_value, valid_from, valid_to")
      .eq("tenant_id", session.tenantId)
      .eq("product_id", params.id)
      .order("valid_to", { ascending: false });

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}
