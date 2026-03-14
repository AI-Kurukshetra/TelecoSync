import { createClient } from "@supabase/supabase-js";

type UsageRecord = {
  account_id: string;
  rated_amount: number | null;
};

const supabase = createClient(
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (request) => {
  const body = await request.json().catch(() => ({}));
  const tenantId = body.tenantId as string | undefined;
  const periodStart = body.periodStart as string | undefined;
  const periodEnd = body.periodEnd as string | undefined;

  if (!tenantId || !periodStart || !periodEnd) {
    return Response.json({ error: "tenantId, periodStart, and periodEnd are required." }, { status: 400 });
  }

  const { data: usageRecords, error: usageError } = await supabase
    .from("usage_records")
    .select("account_id, rated_amount")
    .eq("tenant_id", tenantId)
    .gte("recorded_at", periodStart)
    .lte("recorded_at", periodEnd);

  if (usageError) {
    return Response.json({ error: usageError.message }, { status: 500 });
  }

  const totalsByAccount = (usageRecords as UsageRecord[] | null ?? []).reduce<Record<string, number>>(
    (acc, record) => {
      acc[record.account_id] = (acc[record.account_id] ?? 0) + Number(record.rated_amount ?? 0);
      return acc;
    },
    {}
  );

  const inserts = Object.entries(totalsByAccount).map(([accountId, total], index) => ({
    tenant_id: tenantId,
    account_id: accountId,
    invoice_number: `INV-${Date.now()}-${index + 1}`,
    billing_period_start: periodStart,
    billing_period_end: periodEnd,
    subtotal: total,
    tax: 0,
    total,
    status: "draft"
  }));

  if (inserts.length > 0) {
    const { data: invoices, error: invoiceError } = await supabase
      .from("invoices")
      .insert(inserts)
      .select("id, invoice_number, account_id, total");

    if (invoiceError) {
      return Response.json({ error: invoiceError.message }, { status: 500 });
    }

    await supabase.from("event_log").insert(
      (invoices ?? []).map((invoice) => ({
        tenant_id: tenantId,
        event_type: "invoice.generated",
        entity_type: "invoice",
        entity_id: invoice.id,
        payload_json: invoice,
        source_service: "billing-processor"
      }))
    );

    return Response.json({ generated: invoices?.length ?? 0, invoices });
  }

  return Response.json({ generated: 0, invoices: [] });
});
