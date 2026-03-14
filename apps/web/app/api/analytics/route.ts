import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { getCacheJson, setCacheJson } from "@/lib/cache/upstash";
import { median } from "@/lib/server/page-helpers";

export async function GET() {
  try {
    const session = await requireSessionContext("admin:read");
    const cacheKey = `analytics:snapshot:${session.tenantId}`;
    const cachedSnapshot = await getCacheJson<Record<string, number>>(cacheKey);

    if (cachedSnapshot) {
      return ok(cachedSnapshot, { cached: true });
    }

    const supabase = adminTenantClient();

    const [
      metricsResult,
      apiP95Result,
      ordersResult,
      ticketsResult,
      jobsResult,
      deliveriesResult,
      tenantsResult,
      connectorsResult,
      invoicesResult,
      paymentsResult,
      authEventsResult
    ] = await Promise.all([
      supabase
        .from("performance_metrics")
        .select("value, metric_type")
        .eq("tenant_id", session.tenantId)
        .eq("metric_type", "uptime"),
      supabase
        .from("performance_metrics")
        .select("value")
        .eq("tenant_id", session.tenantId)
        .eq("metric_type", "api_p95_ms")
        .order("recorded_at", { ascending: false })
        .limit(1),
      supabase
        .from("orders")
        .select("created_at, fulfilled_at")
        .eq("tenant_id", session.tenantId)
        .not("fulfilled_at", "is", null),
      supabase
        .from("trouble_tickets")
        .select("created_at, resolved_at")
        .eq("tenant_id", session.tenantId)
        .not("resolved_at", "is", null),
      supabase
        .from("revenue_assurance_jobs")
        .select("leakage_pct")
        .eq("tenant_id", session.tenantId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("webhook_deliveries")
        .select("status")
        .eq("tenant_id", session.tenantId),
      supabase
        .from("tenants")
        .select("id")
        .eq("id", session.tenantId),
      supabase
        .from("connector_executions")
        .select("status")
        .eq("tenant_id", session.tenantId),
      supabase
        .from("invoices")
        .select("id, created_at")
        .eq("tenant_id", session.tenantId),
      supabase
        .from("payments")
        .select("invoice_id, paid_at")
        .eq("tenant_id", session.tenantId)
        .not("paid_at", "is", null)
      ,
      supabase
        .from("event_log")
        .select("entity_id, fired_at")
        .eq("tenant_id", session.tenantId)
        .in("event_type", [
          "auth.login",
          "auth.refresh",
          "auth.logout",
          "auth.register"
        ])
        .gte(
          "fired_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
    ]);

    const errors = [
      metricsResult.error,
      apiP95Result.error,
      ordersResult.error,
      ticketsResult.error,
      jobsResult.error,
      deliveriesResult.error,
      tenantsResult.error,
      connectorsResult.error,
      invoicesResult.error,
      paymentsResult.error,
      authEventsResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      return apiError("INTERNAL_ERROR", errors[0]?.message ?? "Unable to build analytics snapshot.");
    }

    const avg = (values: number[]) =>
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

    const diffHours = (from: string, to: string) =>
      (new Date(to).getTime() - new Date(from).getTime()) / 1000 / 60 / 60;

    const uptimePct30d = avg((metricsResult.data ?? []).map((row) => Number(row.value ?? 0)));
    const medianOrderProcessingHours = median(
      (ordersResult.data ?? []).map((row) => diffHours(row.created_at, row.fulfilled_at))
    );
    const faultResolutionHours = median(
      (ticketsResult.data ?? []).map((row) => diffHours(row.created_at, row.resolved_at))
    );
    const invoiceCreatedAt = new Map((invoicesResult.data ?? []).map((invoice) => [invoice.id, invoice.created_at]));
    const invoiceToPaymentHours = median(
      (paymentsResult.data ?? [])
        .map((payment) => {
          const createdAt = invoiceCreatedAt.get(payment.invoice_id);
          return createdAt ? diffHours(createdAt, payment.paid_at) : null;
        })
        .filter((value): value is number => value !== null)
    );
    const revenueLeakagePct = Number(((jobsResult.data?.[0]?.leakage_pct as number | null) ?? 0).toFixed(4));
    const webhookStatuses = deliveriesResult.data ?? [];
    const webhookDeliverySuccessPct =
      webhookStatuses.length > 0
        ? (webhookStatuses.filter((row) => row.status === "success").length / webhookStatuses.length) * 100
        : 0;
    const connectorStatuses = connectorsResult.data ?? [];
    const connectorExecutionSuccessRate =
      connectorStatuses.length > 0
        ? (connectorStatuses.filter((row) => row.status === "success").length / connectorStatuses.length) * 100
        : 0;
    const dailyActiveUsers = new Set(
      (authEventsResult.data ?? []).map((event) => event.entity_id)
    ).size;
    const vercelP95Ms =
      Number((apiP95Result.data?.[0]?.value as number | null) ?? 0) ||
      (await getVercelP95Ms());

    const snapshot = {
      uptimePct30d: Number(uptimePct30d.toFixed(2)),
      medianOrderProcessingHours: Number(medianOrderProcessingHours.toFixed(2)),
      invoiceToPaymentHours: Number(invoiceToPaymentHours.toFixed(2)),
      faultResolutionHours: Number(faultResolutionHours.toFixed(2)),
      billingAccuracyRate: Number(Math.max(0, 100 - revenueLeakagePct).toFixed(2)),
      revenueLeakagePct,
      webhookDeliverySuccessPct: Number(webhookDeliverySuccessPct.toFixed(2)),
      activeTenants: (tenantsResult.data ?? []).length,
      connectorExecutionSuccessRate: Number(connectorExecutionSuccessRate.toFixed(2)),
      dailyActiveUsers,
      vercelP95Ms
    };

    await setCacheJson(cacheKey, snapshot, 60);

    return ok(snapshot, { cached: false });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function getVercelP95Ms() {
  const staticValue = process.env.VERCEL_ANALYTICS_P95_MS;
  if (staticValue) {
    return Number(staticValue);
  }

  const endpoint = process.env.VERCEL_ANALYTICS_P95_ENDPOINT;
  const token = process.env.VERCEL_ANALYTICS_TOKEN;

  if (!endpoint || !token) {
    return 0;
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return 0;
    }

    const payload = (await response.json()) as { p95Ms?: number };
    return Number(payload.p95Ms ?? 0);
  } catch {
    return 0;
  }
}
