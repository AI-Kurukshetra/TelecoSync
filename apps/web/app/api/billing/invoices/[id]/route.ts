import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { assertCustomerContext, isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("billing:read");
    const supabase = adminTenantClient();
    let query = supabase
      .from("invoices")
      .select("id, account_id, invoice_number, billing_period_start, billing_period_end, subtotal, tax, total, status, due_date, paid_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id);

    if (isCustomerSession(session)) {
      assertCustomerContext(session);
      query = query.eq("account_id", session.accountId!);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Invoice not found.");
    }

    return ok(
      tmfEnvelope("CustomerBill", {
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
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
