export function extractTenantId(requestTenantHeader?: string | null) {
  return requestTenantHeader ?? null;
}
