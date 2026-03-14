import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { paymentSchema } from "@/lib/utils/zod-schemas/billing";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("billing:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    let invoiceIds: string[] | null = null;

    if (isCustomerSession(session)) {
      if (!session.accountId) {
        return apiError("FORBIDDEN", "Customer account context is missing.");
      }

      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("id")
        .eq("tenant_id", session.tenantId)
        .eq("account_id", session.accountId);

      if (invoicesError) {
        return apiError("INTERNAL_ERROR", invoicesError.message);
      }

      invoiceIds = (invoices ?? []).map((invoice) => invoice.id);
      if (invoiceIds.length === 0) {
        return ok([], paginationMeta(pagination, 0));
      }
    }

    let query = supabase
      .from("payments")
      .select("id, invoice_id, amount, currency, method, status, gateway_reference, paid_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (invoiceIds) {
      query = query.in("invoice_id", invoiceIds);
    }

    const { data, error, count } = await query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    return ok(data ?? [], paginationMeta(pagination, count));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("billing:write");
    if (isCustomerSession(session)) {
      return apiError("FORBIDDEN", "Customer self-service users cannot create payments here.");
    }
    const json = await request.json().catch(() => null);
    const result = paymentSchema.safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid payment payload.");
    }

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("payments")
      .insert(
        withTenantScope(session, {
          invoice_id: result.data.invoiceId,
          amount: result.data.amount,
          currency: result.data.currency ?? "USD",
          method: result.data.method ?? null,
          status: result.data.status ?? "pending",
          gateway_reference: result.data.gatewayReference ?? null,
          paid_at: result.data.paidAt ?? null
        })
      )
      .select("id, invoice_id, amount, currency, method, status, gateway_reference, paid_at")
      .single();

    if (error || !data) {
      return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create payment.");
    }

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "payment.created",
      entityType: "payment",
      entityId: data.id,
      payload: {
        id: data.id,
        invoiceId: data.invoice_id,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: data.status,
        gatewayReference: data.gateway_reference,
        paidAt: data.paid_at
      }
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
