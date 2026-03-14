import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("revenue:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("revenue_assurance_jobs")
      .select("id, period_start, period_end, status, total_billed, total_rated, leakage_amount, leakage_pct, completed_at, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Revenue assurance job not found.");
    }

    return ok({
      id: data.id,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      status: data.status,
      totalBilled: data.total_billed,
      totalRated: data.total_rated,
      leakageAmount: data.leakage_amount,
      leakagePct: data.leakage_pct,
      completedAt: data.completed_at,
      createdAt: data.created_at
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
