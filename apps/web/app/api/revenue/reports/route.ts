import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { z } from "zod";
import { recordDomainEvent } from "@/lib/api/events";

const reportSchema = z.object({
  reportType: z.string().min(2),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  payload: z.record(z.unknown()).default({})
});

export async function GET() {
  try {
    const session = await requireSessionContext("revenue:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("financial_reports")
      .select("id, report_type, period_start, period_end, payload_json, generated_by, generated_at")
      .eq("tenant_id", session.tenantId)
      .order("generated_at", { ascending: false });

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
    const result = reportSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid financial report payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("financial_reports")
      .insert(
        withTenantScope(session, {
          report_type: result.data.reportType,
          period_start: result.data.periodStart ?? null,
          period_end: result.data.periodEnd ?? null,
          payload_json: result.data.payload,
          generated_by: session.userId
        })
      )
      .select("id, report_type, period_start, period_end, payload_json, generated_at")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create financial report.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "financial_report.created",
      entityType: "financial_report",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
