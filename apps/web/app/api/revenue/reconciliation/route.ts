import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { revenueAssuranceJobSchema } from "@/lib/utils/zod-schemas/revenue";
import { recordDomainEvent } from "@/lib/api/events";

export async function GET() {
  try {
    const session = await requireSessionContext("revenue:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("reconciliation_runs")
      .select("id, period_start, period_end, status, gross_revenue, adjustments, net_revenue, approved_by, approved_at, notes, created_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("revenue:write");
    const json = await request.json().catch(() => null);
    const result = revenueAssuranceJobSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid reconciliation payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("reconciliation_runs")
      .insert(
        withTenantScope(session, {
          period_start: result.data.periodStart,
          period_end: result.data.periodEnd,
          status: "draft"
        })
      )
      .select("id, period_start, period_end, status, gross_revenue, adjustments, net_revenue")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create reconciliation run.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "reconciliation.created",
      entityType: "reconciliation_run",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
