import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { assertCustomerOwnsCustomer, isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { customerSchema } from "@/lib/utils/zod-schemas/customer";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("customers:read");
    assertCustomerOwnsCustomer(session, params.id);
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, account_number, first_name, last_name, email, phone, status, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Customer not found.");
    }

    const payload = tmfEnvelope("Customer", {
      id: data.id,
      href: tmfHref("customers", data.id),
      accountNumber: data.account_number,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      status: data.status,
      createdAt: data.created_at
    });

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "customer.updated",
      entityType: "customer",
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
    const session = await requireSessionContext("customers:write");
    if (isCustomerSession(session)) {
      return apiError("FORBIDDEN", "Customer self-service users cannot update customer records here.");
    }
    const json = await request.json().catch(() => null);
    const result = customerSchema.partial().safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid customer update payload.");
    }

    const supabase = adminTenantClient();
    const updates: Record<string, unknown> = {};
    if (result.data.accountNumber !== undefined) updates.account_number = result.data.accountNumber;
    if (result.data.firstName !== undefined) updates.first_name = result.data.firstName;
    if (result.data.lastName !== undefined) updates.last_name = result.data.lastName;
    if (result.data.email !== undefined) updates.email = result.data.email;
    if (result.data.phone !== undefined) updates.phone = result.data.phone;

    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, account_number, first_name, last_name, email, phone, status, created_at")
      .maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Customer not found.");
    }

    return ok(
      tmfEnvelope("Customer", {
        id: data.id,
        href: tmfHref("customers", data.id),
        accountNumber: data.account_number,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        createdAt: data.created_at
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("customers:write");
    if (isCustomerSession(session)) {
      return apiError("FORBIDDEN", "Customer self-service users cannot delete customer records.");
    }
    const supabase = adminTenantClient();
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id);

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "customer.deleted",
      entityType: "customer",
      entityId: params.id,
      payload: {
        id: params.id,
        deleted: true
      }
    });

    return ok({ id: params.id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
