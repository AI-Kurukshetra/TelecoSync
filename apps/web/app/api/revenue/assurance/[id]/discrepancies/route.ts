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
    const session = await requireSessionContext("revenue:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("revenue_discrepancies")
      .select("id, account_id, usage_record_id, invoice_id, discrepancy_type, expected_amount, actual_amount, delta, resolution, resolved_at, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("job_id", params.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}
