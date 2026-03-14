import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { getDefaultRouteForRole } from "@/lib/auth/access";
import { registerSchema } from "@/lib/auth/schemas";
import { resolveTenantContext } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const adminPermissions = {
  customers: ["read", "write"],
  products: ["read", "write"],
  orders: ["read", "write"],
  billing: ["read", "write"],
  operations: ["read", "write"],
  admin: ["read", "write"]
};

const inventoryManagerPermissions = {
  customers: ["read"],
  products: ["read", "write"],
  orders: ["read"],
  billing: ["read", "write"],
  operations: ["read", "write"]
};

const customerPermissions = {
  customer: ["read"],
  products: ["read"],
  orders: ["read"],
  billing: ["read"]
};

function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" ") || "Customer"
  };
}

function nextCustomerSequence(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

async function ensureTenantRole(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  tenantId: string,
  roleName: "admin" | "inventory_manager" | "customer"
) {
  const permissionsByRole = {
    admin: adminPermissions,
    inventory_manager: inventoryManagerPermissions,
    customer: customerPermissions
  };

  const { data: existingRole, error: existingRoleError } = await adminClient
    .from("roles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", roleName)
    .maybeSingle();

  if (existingRoleError) {
    throw new Error(existingRoleError.message);
  }

  if (existingRole?.id) {
    return existingRole.id;
  }

  const { data: createdRole, error: createRoleError } = await adminClient
    .from("roles")
    .insert({
      tenant_id: tenantId,
      name: roleName,
      permissions_json: permissionsByRole[roleName]
    })
    .select("id")
    .single();

  if (createRoleError || !createdRole) {
    throw new Error(createRoleError?.message ?? `Unable to create ${roleName} role.`);
  }

  return createdRole.id;
}

async function signInAndRespond(email: string, password: string) {
  const supabase = createServerSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (sessionError || !sessionData.user) {
    throw new Error(sessionError?.message ?? "Automatic sign-in failed.");
  }

  const tenantContext = resolveTenantContext(sessionData.user);

  if (!tenantContext) {
    throw new Error("New account is missing tenant metadata.");
  }

  const response = NextResponse.json({
    data: {
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email ?? null
      },
      tenant: tenantContext,
      nextPath: getDefaultRouteForRole(tenantContext.role)
    }
  });

  response.cookies.set("telecosync-tenant", tenantContext.tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return {
    response,
    sessionUser: sessionData.user,
    tenantContext
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid registration payload.");
  }

  const { role, fullName, department, email, password, tenantName, tenantSlug, phone } = parsed.data;
  const adminClient = createAdminSupabaseClient();

  try {
    if (role === "admin") {
      const { data: existingTenant } = await adminClient
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .maybeSingle();

      if (existingTenant) {
        return apiError("FORBIDDEN", "Tenant slug is already in use.");
      }

      const { data: tenant, error: tenantError } = await adminClient
        .from("tenants")
        .insert({
          name: tenantName!,
          slug: tenantSlug,
          plan: "starter",
          status: "active"
        })
        .select("id, slug")
        .single();

      if (tenantError || !tenant) {
        return apiError("INTERNAL_ERROR", tenantError?.message ?? "Unable to create tenant.");
      }

      try {
        const roleId = await ensureTenantRole(adminClient, tenant.id, "admin");
        await ensureTenantRole(adminClient, tenant.id, "inventory_manager");
        await ensureTenantRole(adminClient, tenant.id, "customer");

        const { data: createdUser, error: userError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: {
            tenant_id: tenant.id,
            tenant_slug: tenant.slug,
            role: "admin"
          },
          user_metadata: {
            full_name: fullName,
            department: department ?? "Administration",
            tenant_id: tenant.id,
            tenant_slug: tenant.slug,
            role: "admin"
          }
        });

        if (userError || !createdUser.user) {
          throw new Error(userError?.message ?? "Unable to create administrator.");
        }

        const { error: profileError } = await adminClient.from("user_profiles").insert({
          id: createdUser.user.id,
          tenant_id: tenant.id,
          role_id: roleId,
          full_name: fullName,
          department: department ?? "Administration",
          status: "active"
        });

        if (profileError) {
          await adminClient.auth.admin.deleteUser(createdUser.user.id);
          throw new Error(profileError.message ?? "Unable to create administrator profile.");
        }

        const { response, sessionUser, tenantContext } = await signInAndRespond(email, password);

        await recordDomainEvent({
          tenantId: tenantContext.tenantId,
          eventType: "auth.register",
          entityType: "user",
          entityId: sessionUser.id,
          payload: {
            email: sessionUser.email ?? null,
            tenantId: tenantContext.tenantId,
            role
          }
        });

        return response;
      } catch (error) {
        await adminClient.from("roles").delete().eq("tenant_id", tenant.id);
        await adminClient.from("tenants").delete().eq("id", tenant.id);
        return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Unable to complete administrator signup.");
      }
    }

    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .select("id, slug")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (tenantError) {
      return apiError("INTERNAL_ERROR", tenantError.message);
    }

    if (!tenant) {
      return apiError("NOT_FOUND", "Carrier tenant not found.");
    }

    if (role === "inventory_manager") {
      const roleId = await ensureTenantRole(adminClient, tenant.id, "inventory_manager");

      const { data: createdUser, error: userError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          tenant_id: tenant.id,
          tenant_slug: tenant.slug,
          role: "inventory_manager"
        },
        user_metadata: {
          full_name: fullName,
          department: department ?? "Inventory",
          tenant_id: tenant.id,
          tenant_slug: tenant.slug,
          role: "inventory_manager"
        }
      });

      if (userError || !createdUser.user) {
        return apiError("INTERNAL_ERROR", userError?.message ?? "Unable to create inventory manager.");
      }

      const { error: profileError } = await adminClient.from("user_profiles").insert({
        id: createdUser.user.id,
        tenant_id: tenant.id,
        role_id: roleId,
        full_name: fullName,
        department: department ?? "Inventory",
        status: "active"
      });

      if (profileError) {
        await adminClient.auth.admin.deleteUser(createdUser.user.id);
        return apiError("INTERNAL_ERROR", profileError.message ?? "Unable to create inventory manager profile.");
      }

      const { response, sessionUser, tenantContext } = await signInAndRespond(email, password);

      await recordDomainEvent({
        tenantId: tenantContext.tenantId,
        eventType: "auth.register",
        entityType: "user",
        entityId: sessionUser.id,
        payload: {
          email: sessionUser.email ?? null,
          tenantId: tenantContext.tenantId,
          role
        }
      });

      return response;
    }

    const roleId = await ensureTenantRole(adminClient, tenant.id, "customer");
    const { firstName, lastName } = splitName(fullName);

    const { data: customer, error: customerError } = await adminClient
      .from("customers")
      .insert({
        tenant_id: tenant.id,
        account_number: nextCustomerSequence(tenant.slug.toUpperCase()),
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone ?? null
      })
      .select("id")
      .single();

    if (customerError || !customer) {
      return apiError("INTERNAL_ERROR", customerError?.message ?? "Unable to create customer profile.");
    }

    const { data: account, error: accountError } = await adminClient
      .from("accounts")
      .insert({
        tenant_id: tenant.id,
        customer_id: customer.id,
        account_type: "individual",
        status: "active",
        balance: 0,
        credit_limit: 0,
        currency: "USD"
      })
      .select("id")
      .single();

    if (accountError || !account) {
      await adminClient.from("customers").delete().eq("id", customer.id);
      return apiError("INTERNAL_ERROR", accountError?.message ?? "Unable to create customer account.");
    }

    const { data: createdUser, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        role: "customer",
        customer_id: customer.id,
        account_id: account.id
      },
      user_metadata: {
        full_name: fullName,
        phone: phone ?? null,
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        role: "customer",
        customer_id: customer.id,
        account_id: account.id
      }
    });

    if (userError || !createdUser.user) {
      await adminClient.from("accounts").delete().eq("id", account.id);
      await adminClient.from("customers").delete().eq("id", customer.id);
      return apiError("INTERNAL_ERROR", userError?.message ?? "Unable to create customer login.");
    }

    const { error: profileError } = await adminClient.from("user_profiles").insert({
      id: createdUser.user.id,
      tenant_id: tenant.id,
      role_id: roleId,
      full_name: fullName,
      department: "Customer",
      status: "active"
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      await adminClient.from("accounts").delete().eq("id", account.id);
      await adminClient.from("customers").delete().eq("id", customer.id);
      return apiError("INTERNAL_ERROR", profileError.message ?? "Unable to create customer profile.");
    }

    const { response, sessionUser, tenantContext } = await signInAndRespond(email, password);

    await recordDomainEvent({
      tenantId: tenantContext.tenantId,
      eventType: "customer.self_registered",
      entityType: "customer",
      entityId: customer.id,
      payload: {
        accountId: account.id,
        customerId: customer.id,
        email
      }
    });

    await recordDomainEvent({
      tenantId: tenantContext.tenantId,
      eventType: "auth.register",
      entityType: "user",
      entityId: sessionUser.id,
      payload: {
        email: sessionUser.email ?? null,
        tenantId: tenantContext.tenantId,
        customerId: customer.id,
        role
      }
    });

    return response;
  } catch (error) {
    return apiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Unable to complete signup.");
  }
}
