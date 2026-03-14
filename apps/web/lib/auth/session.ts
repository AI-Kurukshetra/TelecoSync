import type { User } from "@supabase/supabase-js";
import type { AppPermission } from "@/lib/api/auth-guard";
import { getDefaultRouteForRole, normalizeAppRole } from "@/lib/auth/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const AUTH_PAGE_PATHS = [
  "/login",
  "/login/customer",
  "/register",
  "/register/customer",
  "/forgot-password",
  "/reset-password",
];
export const AUTH_API_PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/register/customer",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
];
export const DEFAULT_AUTH_REDIRECT = "/";

export type TenantContext = {
  tenantId: string;
  role: string | null;
  tenantSlug: string | null;
  customerId: string | null;
  accountId: string | null;
};

export type SessionContext = TenantContext & {
  userId: string;
  email: string | null;
  fullName: string | null;
  permissions: AppPermission[];
};

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function flattenPermissions(value: unknown): AppPermission[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const permissions: AppPermission[] = [];
  for (const [scope, actions] of Object.entries(value)) {
    if (!Array.isArray(actions)) {
      continue;
    }

    for (const action of actions) {
      if (typeof action === "string" && action.length > 0) {
        permissions.push(`${scope}:${action}`);
      }
    }
  }

  return permissions;
}

export function resolveTenantContext(user: User | null): TenantContext | null {
  if (!user) {
    return null;
  }

  const tenantId =
    asString(user.app_metadata.tenant_id) ??
    asString(user.user_metadata.tenant_id);

  if (!tenantId) {
    return null;
  }

  return {
    tenantId,
    role: asString(user.app_metadata.role) ?? asString(user.user_metadata.role),
    tenantSlug:
      asString(user.app_metadata.tenant_slug) ??
      asString(user.user_metadata.tenant_slug),
    customerId:
      asString(user.app_metadata.customer_id) ??
      asString(user.user_metadata.customer_id),
    accountId:
      asString(user.app_metadata.account_id) ??
      asString(user.user_metadata.account_id),
  };
}

export async function getCurrentSessionContext(): Promise<SessionContext | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tenantContext = resolveTenantContext(user);

  if (!user || !tenantContext) {
    return null;
  }

  const adminClient = createAdminSupabaseClient();
  const { data: profile } = await adminClient
    .from("user_profiles")
    .select("role_id")
    .eq("id", user.id)
    .eq("tenant_id", tenantContext.tenantId)
    .maybeSingle();

  const { data: roleRecord } = profile?.role_id
    ? await adminClient
        .from("roles")
        .select("name, permissions_json")
        .eq("id", profile.role_id)
        .eq("tenant_id", tenantContext.tenantId)
        .maybeSingle()
    : { data: null };
  const permissions = flattenPermissions(roleRecord?.permissions_json);
  const resolvedRole =
    asString(roleRecord?.name) ??
    asString(user.app_metadata.role) ??
    asString(user.user_metadata.role);

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: asString(user.user_metadata.full_name),
    permissions,
    ...tenantContext,
    role: normalizeAppRole(resolvedRole, permissions),
  };
}

export function getDefaultRedirectForSession(
  role: string | null | undefined,
  permissions: AppPermission[] = [],
) {
  return getDefaultRouteForRole(role, permissions);
}
