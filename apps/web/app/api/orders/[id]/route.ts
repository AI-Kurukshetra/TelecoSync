import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { assertCustomerContext, isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";
import { orderSchema } from "@/lib/utils/zod-schemas/order";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("orders:read");
    const supabase = adminTenantClient();
    let query = supabase
      .from("orders")
      .select("id, customer_id, account_id, order_number, order_type, status, items_json, total_amount, currency, created_at, fulfilled_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id);

    if (isCustomerSession(session)) {
      assertCustomerContext(session);
      query = query.eq("customer_id", session.customerId!);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Order not found.");
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
      eventType: "order.updated",
      entityType: "order",
      entityId: data.id,
      payload
    });

    return ok(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("orders:write");
    if (isCustomerSession(session)) {
      return apiError("FORBIDDEN", "Customer self-service users cannot update orders.");
    }
    const json = await request.json().catch(() => null);
    const result = orderSchema.partial().safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid order update payload.");
    }

    const updates: Record<string, unknown> = {};
    if (result.data.customerId !== undefined) updates.customer_id = result.data.customerId;
    if (result.data.orderType !== undefined) updates.order_type = result.data.orderType;
    if (result.data.items !== undefined) updates.items_json = result.data.items;

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, customer_id, account_id, order_number, order_type, status, items_json, total_amount, currency, created_at, fulfilled_at")
      .maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Order not found.");
    }

    return ok(
      tmfEnvelope("ProductOrder", {
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
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
