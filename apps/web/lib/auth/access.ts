import { ROLE_GUIDES, type DefaultRole } from "@telecosync/shared/constants/roles";
import type { AppPermission } from "@/lib/api/auth-guard";

export type AppRole = DefaultRole;

const ROLE_ALIASES: Record<string, AppRole> = {
  admin: "admin",
  platform_admin: "admin",
  super_admin: "admin",
  tenant_admin: "admin",
  finance: "admin",
  finance_controller: "admin",
  billing_admin: "admin",
  revenue_manager: "admin",
  operations: "inventory_manager",
  operations_manager: "inventory_manager",
  network_ops: "inventory_manager",
  noc: "inventory_manager",
  inventory_manager: "inventory_manager",
  inventory_admin: "inventory_manager",
  support: "inventory_manager",
  customer_support: "inventory_manager",
  service_desk: "inventory_manager",
  care: "inventory_manager",
  customer: "customer",
  subscriber: "customer",
  customer_user: "customer",
  viewer: "admin",
  read_only: "admin",
  auditor: "admin"
};

const ROLE_ROUTE_PREFIXES: Record<AppRole, string[]> = {
  admin: ["/"],
  inventory_manager: ["/inventory", "/products", "/customers", "/orders", "/billing"],
  customer: ["/dashboard", "/my-services", "/products", "/orders", "/billing", "/documents", "/notifications"]
};

const ROLE_DEFAULT_ROUTES: Record<AppRole, string> = {
  admin: "/users",
  inventory_manager: "/inventory",
  customer: "/dashboard",
};

export function normalizeAppRole(role: string | null | undefined, permissions: AppPermission[] = []): AppRole {
  const normalizedRole = role?.trim().toLowerCase();
  if (normalizedRole && Object.hasOwn(ROLE_ALIASES, normalizedRole)) {
    const mappedRole = ROLE_ALIASES[normalizedRole as keyof typeof ROLE_ALIASES];
    if (mappedRole) {
      return mappedRole;
    }
  }

  if (permissions.some((permission) => permission.startsWith("admin:"))) {
    return "admin";
  }
  if (
    permissions.some((permission) =>
      ["operations:", "products:", "customers:", "orders:", "billing:"].some((prefix) =>
        permission.startsWith(prefix)
      )
    )
  ) {
    return "inventory_manager";
  }

  if (permissions.some((permission) => permission.startsWith("customer:"))) {
    return "customer";
  }

  return "customer";
}

export function getRoleGuide(role: string | null | undefined, permissions: AppPermission[] = []) {
  return ROLE_GUIDES[normalizeAppRole(role, permissions)];
}

export function getAllowedRoutePrefixes(role: string | null | undefined, permissions: AppPermission[] = []) {
  return ROLE_ROUTE_PREFIXES[normalizeAppRole(role, permissions)];
}

export function getDefaultRouteForRole(role: string | null | undefined, permissions: AppPermission[] = []) {
  return ROLE_DEFAULT_ROUTES[normalizeAppRole(role, permissions)];
}

export function canAccessAppPath(
  pathname: string,
  role: string | null | undefined,
  permissions: AppPermission[] = []
) {
  if (pathname === "/" || pathname.startsWith("/api/") || pathname.startsWith("/access-denied")) {
    return true;
  }

  const appRole = normalizeAppRole(role, permissions);
  if (appRole === "admin") {
    return true;
  }

  return ROLE_ROUTE_PREFIXES[appRole].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
