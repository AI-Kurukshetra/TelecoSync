import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const leakageAlertThresholdPct = Number(
  Deno.env.get("REVENUE_LEAKAGE_ALERT_THRESHOLD_PCT") ?? "0.5"
);

Deno.serve(async (request) => {
  const body = await request.json().catch(() => ({}));
  const tenantId = body.tenantId as string | undefined;
  const periodStart = body.periodStart as string | undefined;
  const periodEnd = body.periodEnd as string | undefined;

  if (!tenantId || !periodStart || !periodEnd) {
    return Response.json({ error: "tenantId, periodStart, and periodEnd are required." }, { status: 400 });
  }

  const [{ data: usage }, { data: invoices }] = await Promise.all([
    supabase
      .from("usage_records")
      .select("id, account_id, rated_amount")
      .eq("tenant_id", tenantId)
      .gte("recorded_at", periodStart)
      .lte("recorded_at", periodEnd),
    supabase
      .from("invoices")
      .select("id, account_id, total")
      .eq("tenant_id", tenantId)
      .gte("billing_period_start", periodStart)
      .lte("billing_period_end", periodEnd)
  ]);

  const usageByAccount = new Map<
    string,
    { total: number; usageRecordId: string | null }
  >();
  for (const row of usage ?? []) {
    const existing = usageByAccount.get(row.account_id) ?? {
      total: 0,
      usageRecordId: row.id
    };
    existing.total += Number(row.rated_amount ?? 0);
    usageByAccount.set(row.account_id, existing);
  }

  const invoicesByAccount = new Map<
    string,
    { total: number; invoiceId: string | null }
  >();
  for (const row of invoices ?? []) {
    const existing = invoicesByAccount.get(row.account_id) ?? {
      total: 0,
      invoiceId: row.id
    };
    existing.total += Number(row.total ?? 0);
    invoicesByAccount.set(row.account_id, existing);
  }

  const totalRated = Array.from(usageByAccount.values()).reduce((sum, row) => sum + row.total, 0);
  const totalBilled = Array.from(invoicesByAccount.values()).reduce((sum, row) => sum + row.total, 0);
  const leakagePct = totalRated === 0 ? 0 : Number((((totalRated - totalBilled) / totalRated) * 100).toFixed(4));

  const { data: job, error: jobError } = await supabase
    .from("revenue_assurance_jobs")
    .insert({
      tenant_id: tenantId,
      period_start: periodStart,
      period_end: periodEnd,
      status: "completed",
      total_billed: totalBilled,
      total_rated: totalRated,
      leakage_pct: leakagePct,
      completed_at: new Date().toISOString()
    })
    .select("id, leakage_pct")
    .single();

  if (jobError || !job) {
    return Response.json({ error: jobError?.message ?? "Unable to create assurance job." }, { status: 500 });
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
        tenant_id: tenantId,
        job_id: job.id,
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
      return Response.json({ error: discrepancyError.message }, { status: 500 });
    }
  }

  await supabase.from("event_log").insert({
    tenant_id: tenantId,
    event_type: "revenue.assurance.completed",
    entity_type: "revenue_assurance_job",
    entity_id: job.id,
    payload_json: {
      jobId: job.id,
      leakagePct,
      discrepancyCount: discrepancies.length
    },
    source_service: "revenue-assurance-processor"
  });

  if (leakagePct > leakageAlertThresholdPct) {
    await supabase.from("event_log").insert({
      tenant_id: tenantId,
      event_type: "revenue.leakage.alert",
      entity_type: "revenue_assurance_job",
      entity_id: job.id,
      payload_json: {
        jobId: job.id,
        leakagePct,
        thresholdPct: leakageAlertThresholdPct
      },
      source_service: "revenue-assurance-processor"
    });
  }

  return Response.json({
    jobId: job.id,
    leakagePct: job.leakage_pct,
    discrepancyCount: discrepancies.length
  });
});
