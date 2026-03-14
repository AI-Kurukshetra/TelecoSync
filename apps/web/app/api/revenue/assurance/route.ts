import { created, ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { recordDomainEvent } from "@/lib/api/events";
import { revenueAssuranceJobSchema } from "@/lib/utils/zod-schemas/revenue";

const leakageAlertThresholdPct = Number(
  process.env.REVENUE_LEAKAGE_ALERT_THRESHOLD_PCT ?? "0.5"
);

export async function GET() {
  try {
    const session = await requireSessionContext("revenue:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("revenue_assurance_jobs")
      .select("id, period_start, period_end, status, total_billed, total_rated, leakage_pct, completed_at, created_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    return ok(
      (data ?? []).map((job) => ({
        id: job.id,
        periodStart: job.period_start,
        periodEnd: job.period_end,
        status: job.status,
        totalBilled: job.total_billed,
        totalRated: job.total_rated,
        leakagePct: job.leakage_pct,
        completedAt: job.completed_at
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("revenue:write");
    const json = await request.json().catch(() => null);
    const result = revenueAssuranceJobSchema.safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid revenue assurance job payload.");
    }

    const supabase = adminTenantClient();
    const [{ data: usageRecords, error: usageError }, { data: invoices, error: invoicesError }] =
      await Promise.all([
        supabase
          .from("usage_records")
          .select("id, account_id, rated_amount, recorded_at")
          .eq("tenant_id", session.tenantId)
          .gte("recorded_at", result.data.periodStart)
          .lte("recorded_at", result.data.periodEnd),
        supabase
          .from("invoices")
          .select("id, account_id, total, billing_period_start, billing_period_end")
          .eq("tenant_id", session.tenantId)
          .gte("billing_period_start", result.data.periodStart)
          .lte("billing_period_end", result.data.periodEnd)
      ]);

    if (usageError || invoicesError) {
      return apiError(
        "INTERNAL_ERROR",
        usageError?.message ?? invoicesError?.message ?? "Unable to run assurance analysis."
      );
    }

    const usageByAccount = new Map<
      string,
      { total: number; usageRecordId: string | null }
    >();
    for (const row of usageRecords ?? []) {
      const accountId = row.account_id;
      const existing = usageByAccount.get(accountId) ?? {
        total: 0,
        usageRecordId: row.id
      };
      existing.total += Number(row.rated_amount ?? 0);
      usageByAccount.set(accountId, existing);
    }

    const invoicesByAccount = new Map<
      string,
      { total: number; invoiceId: string | null }
    >();
    for (const row of invoices ?? []) {
      const accountId = row.account_id;
      const existing = invoicesByAccount.get(accountId) ?? {
        total: 0,
        invoiceId: row.id
      };
      existing.total += Number(row.total ?? 0);
      invoicesByAccount.set(accountId, existing);
    }

    const totalRated = Array.from(usageByAccount.values()).reduce(
      (sum, row) => sum + row.total,
      0
    );
    const totalBilled = Array.from(invoicesByAccount.values()).reduce(
      (sum, row) => sum + row.total,
      0
    );
    const leakagePct =
      totalRated === 0
        ? 0
        : Number((((totalRated - totalBilled) / totalRated) * 100).toFixed(4));

    const { data, error } = await supabase
      .from("revenue_assurance_jobs")
      .insert(
        {
          tenant_id: session.tenantId,
          period_start: result.data.periodStart,
          period_end: result.data.periodEnd,
          status: "completed",
          total_billed: totalBilled,
          total_rated: totalRated,
          leakage_pct: leakagePct,
          completed_at: new Date().toISOString()
        }
      )
      .select("id, period_start, period_end, status, total_billed, total_rated, leakage_amount, leakage_pct, completed_at")
      .single();

    if (error || !data) {
      return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create assurance job.");
    }

    const accountIds = new Set([
      ...usageByAccount.keys(),
      ...invoicesByAccount.keys()
    ]);
    const discrepancies = Array.from(accountIds)
      .map((accountId) => {
        const expected = usageByAccount.get(accountId)?.total ?? 0;
        const actual = invoicesByAccount.get(accountId)?.total ?? 0;
        const delta = Number((expected - actual).toFixed(4));

        if (Math.abs(delta) < 0.01) {
          return null;
        }

        return {
          tenant_id: session.tenantId,
          job_id: data.id,
          account_id: accountId,
          usage_record_id: usageByAccount.get(accountId)?.usageRecordId ?? null,
          invoice_id: invoicesByAccount.get(accountId)?.invoiceId ?? null,
          discrepancy_type:
            actual === 0
              ? "unbilled_usage"
              : expected === 0
                ? "invoice_without_usage"
                : "amount_mismatch",
          expected_amount: expected,
          actual_amount: actual
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (discrepancies.length > 0) {
      const { error: discrepancyError } = await supabase
        .from("revenue_discrepancies")
        .insert(discrepancies);

      if (discrepancyError) {
        return apiError("INTERNAL_ERROR", discrepancyError.message);
      }
    }

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "revenue.assurance.completed",
      entityType: "revenue_assurance_job",
      entityId: data.id,
      payload: {
        ...data,
        discrepancyCount: discrepancies.length
      }
    });

    if (leakagePct > leakageAlertThresholdPct) {
      await recordDomainEvent({
        tenantId: session.tenantId,
        eventType: "revenue.leakage.alert",
        entityType: "revenue_assurance_job",
        entityId: data.id,
        payload: {
          jobId: data.id,
          leakagePct,
          thresholdPct: leakageAlertThresholdPct
        },
        sourceService: "web-api"
      });
    }

    return created({
      id: data.id,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      status: data.status,
      totalBilled: data.total_billed,
      totalRated: data.total_rated,
      leakageAmount: data.leakage_amount,
      leakagePct: data.leakage_pct,
      completedAt: data.completed_at,
      discrepancyCount: discrepancies.length
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
