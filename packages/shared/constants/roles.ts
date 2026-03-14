export const DEFAULT_ROLES = ["admin", "inventory_manager", "customer"] as const;

export type DefaultRole = (typeof DEFAULT_ROLES)[number];

export const ROLE_GUIDES: Record<
  DefaultRole,
  {
    label: string;
    summary: string;
    focus: string;
    primaryRoutes: string[];
  }
> = {
  admin: {
    label: "Administrator",
    summary: "Manages inventory, customer records, provisioning, integrations, and governance surfaces.",
    focus: "Use the inventory screens first, then move into the supporting operational and admin modules as needed.",
    primaryRoutes: ["/users", "/billing", "/billing/invoices", "/audit"]
  },
  inventory_manager: {
    label: "Inventory manager",
    summary: "Manages inventory, product setup, customer order visibility, and billing operations.",
    focus: "Start from inventory, then move into products, order visibility, and billing workflows.",
    primaryRoutes: ["/inventory", "/products", "/orders", "/billing"]
  },
  customer: {
    label: "Customer",
    summary: "Tracks services, orders, invoices, and account status without administrative access.",
    focus: "Use the dashboard to review products, orders, and billing activity.",
    primaryRoutes: ["/dashboard", "/products", "/orders", "/billing"]
  }
};
