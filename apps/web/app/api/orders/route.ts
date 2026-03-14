import { created, ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { assertCustomerContext, isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient, nextSequence, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { orderSchema } from "@/lib/utils/zod-schemas/order";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("orders:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    let query = supabase
      .from("orders")
      .select("id, customer_id, account_id, order_number, order_type, status, items_json, total_amount, currency, created_at, fulfilled_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (isCustomerSession(session)) {
      assertCustomerContext(session);
      query = query.eq("customer_id", session.customerId!);
    }

    const { data, error, count } = await query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    return ok(
      (data ?? []).map((order: {
        id: string;
        customer_id: string;
        account_id: string | null;
        order_number: string;
        order_type: string;
        status: string;
        items_json: unknown;
        total_amount: number | null;
        currency: string | null;
        created_at: string | null;
        fulfilled_at: string | null;
      }) =>
        tmfEnvelope("ProductOrder", {
          id: order.id,
          href: tmfHref("orders", order.id),
          orderNumber: order.order_number,
          customerId: order.customer_id,
          accountId: order.account_id,
          orderType: order.order_type,
          status: order.status,
          items: order.items_json,
          totalAmount: order.total_amount,
          currency: order.currency,
          requestedStartDate: order.created_at,
          completionDate: order.fulfilled_at
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
    const session = await requireSessionContext("orders:write");
    if (isCustomerSession(session)) {
      return apiError("FORBIDDEN", "Customer self-service users cannot create orders here.");
    }
    const json = await request.json().catch(() => null);
    const result = orderSchema.safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid order payload.");
    }

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("orders")
      .insert(
        withTenantScope(session, {
          customer_id: result.data.customerId,
          account_id: null,
          order_number: nextSequence("ORD"),
          order_type: result.data.orderType,
          status: "pending",
          items_json: result.data.items,
          total_amount: null,
          currency: "USD"
        })
      )
      .select("id, customer_id, account_id, order_number, order_type, status, items_json, total_amount, currency, created_at, fulfilled_at")
      .single();

    if (error || !data) {
      return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create order.");
    }

    const payload = tmfEnvelope("ProductOrder", {
      id: data.id,
      href: tmfHref("orders", data.id),
      orderNumber: data.order_number,
      customerId: data.customer_id,
      accountId: data.account_id,
      orderType: data.order_type,
      status: data.status,
      items: data.items_json,
      totalAmount: data.total_amount,
      currency: data.currency,
      requestedStartDate: data.created_at,
      completionDate: data.fulfilled_at
    });

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "order.created",
      entityType: "order",
      entityId: data.id,
      payload
    });

    return created(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
