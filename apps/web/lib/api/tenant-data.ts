import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type TenantSession = {
  tenantId: string;
};

export function adminTenantClient() {
  return createAdminSupabaseClient();
}

export function withTenantScope<T extends Record<string, unknown>>(
  session: TenantSession,
  payload: T
) {
  return {
    ...payload,
    tenant_id: session.tenantId
  };
}

export function nextSequence(prefix: string) {
  return `${prefix}-${Date.now()}`;
}
