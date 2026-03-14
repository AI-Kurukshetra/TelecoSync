import { created, ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { assertCustomerContext, isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient, nextSequence, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { invoiceSchema } from "@/lib/utils/zod-schemas/billing";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("billing:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    let query = supabase
      .from("invoices")
      .select("id, account_id, invoice_number, billing_period_start, billing_period_end, subtotal, tax, total, status, due_date, paid_at, created_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (isCustomerSession(session)) {
      assertCustomerContext(session);
      query = query.eq("account_id", session.accountId!);
    }

    const { data, error, count } = await query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    return ok(
      (data ?? []).map((invoice: {
        id: string;
        account_id: string;
        invoice_number: string;
        billing_period_start: string;
        billing_period_end: string;
        subtotal: number | null;
        tax: number | null;
        total: number | null;
        status: string;
        due_date: string | null;
        paid_at: string | null;
      }) =>
        tmfEnvelope("CustomerBill", {
          id: invoice.id,
          href: tmfHref("billing/invoices", invoice.id),
          accountId: invoice.account_id,
          invoiceNumber: invoice.invoice_number,
          billingPeriod: {
            startDateTime: invoice.billing_period_start,
            endDateTime: invoice.billing_period_end
          },
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          status: invoice.status,
          dueDate: invoice.due_date,
          paidAt: invoice.paid_at
        })
      ),
      paginationMeta(pagination, count)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("billing:write");
    if (isCustomerSession(session)) {
      return apiError("FORBIDDEN", "Customer self-service users cannot create invoices.");
    }
    const json = await request.json().catch(() => null);
    const result = invoiceSchema.safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid invoice payload.");
    }

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("invoices")
      .insert(
        withTenantScope(session, {
          account_id: result.data.accountId,
          invoice_number: nextSequence("INV"),
          billing_period_start: result.data.billingPeriodStart,
          billing_period_end: result.data.billingPeriodEnd,
          subtotal: result.data.subtotal ?? null,
          tax: result.data.tax ?? null,
          total: result.data.total ?? null,
          status: "draft",
          due_date: result.data.dueDate ?? null
        })
      )
      .select("id, account_id, invoice_number, billing_period_start, billing_period_end, subtotal, tax, total, status, due_date, paid_at")
      .single();

    if (error || !data) {
      return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create invoice.");
    }

    const payload = tmfEnvelope("CustomerBill", {
      id: data.id,
      href: tmfHref("billing/invoices", data.id),
      accountId: data.account_id,
      invoiceNumber: data.invoice_number,
      billingPeriod: {
        startDateTime: data.billing_period_start,
        endDateTime: data.billing_period_end
      },
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      status: data.status,
      dueDate: data.due_date,
      paidAt: data.paid_at
    });

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "invoice.created",
      entityType: "invoice",
      entityId: data.id,
      payload
    });

    return created(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
