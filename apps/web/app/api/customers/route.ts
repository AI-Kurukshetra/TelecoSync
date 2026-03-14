import { created, ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { normalizeAppRole } from "@/lib/auth/access";
import { assertCustomerContext, isCustomerSession } from "@/lib/auth/customer-access";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { customerSchema } from "@/lib/utils/zod-schemas/customer";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

async function listRegisteredCustomerIds(targetTenantId: string) {
  const supabase = adminTenantClient();
  const customerIds = new Set<string>();
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data.users ?? [];
    for (const user of users) {
      const userTenantId =
        typeof user.app_metadata.tenant_id === "string"
          ? user.app_metadata.tenant_id
          : typeof user.user_metadata.tenant_id === "string"
            ? user.user_metadata.tenant_id
            : null;
      const role =
        typeof user.app_metadata.role === "string"
          ? user.app_metadata.role
          : typeof user.user_metadata.role === "string"
            ? user.user_metadata.role
            : null;
      const customerId =
        typeof user.app_metadata.customer_id === "string"
          ? user.app_metadata.customer_id
          : typeof user.user_metadata.customer_id === "string"
            ? user.user_metadata.customer_id
            : null;

      if (userTenantId === targetTenantId && normalizeAppRole(role) === "customer" && customerId) {
        customerIds.add(customerId);
      }
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return [...customerIds];
}

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("customers:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const registeredCustomerIds =
      session.role === "admin" ? await listRegisteredCustomerIds(session.tenantId) : null;

    if (session.role === "admin" && registeredCustomerIds && registeredCustomerIds.length === 0) {
      return ok([], paginationMeta(pagination, 0));
    }

    let query = supabase
      .from("customers")
      .select("id, account_number, first_name, last_name, email, phone, status, created_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (isCustomerSession(session)) {
      assertCustomerContext(session);
      query = query.eq("id", session.customerId!);
    } else if (session.role === "admin" && registeredCustomerIds) {
      query = query.in("id", registeredCustomerIds);
    }

    const { data, error, count } = await query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

      return ok(
      (data ?? []).map((customer: {
        id: string;
        account_number: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
        status: string;
      }) =>
        tmfEnvelope("Customer", {
          id: customer.id,
          href: tmfHref("customers", customer.id),
          accountNumber: customer.account_number,
          firstName: customer.first_name,
          lastName: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          status: customer.status
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
    const session = await requireSessionContext("customers:write");
    if (isCustomerSession(session)) {
      return apiError("FORBIDDEN", "Customer self-service users cannot create customer records here.");
    }
    const json = await request.json().catch(() => null);
    const result = customerSchema.safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid customer payload.");
    }

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("customers")
      .insert(
        withTenantScope(session, {
          account_number: result.data.accountNumber,
          first_name: result.data.firstName,
          last_name: result.data.lastName,
          email: result.data.email,
          phone: result.data.phone ?? null
        })
      )
      .select("id, account_number, first_name, last_name, email, phone, status")
      .single();

    if (error || !data) {
      return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create customer.");
    }

    const payload = tmfEnvelope("Customer", {
      id: data.id,
      href: tmfHref("customers", data.id),
      accountNumber: data.account_number,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      status: data.status
    });

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "customer.created",
      entityType: "customer",
      entityId: data.id,
      payload
    });

    return created(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
