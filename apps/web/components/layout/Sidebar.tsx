import type { Route } from "next";
import Link from "next/link";
import {
  canAccessAppPath,
  normalizeAppRole,
  type AppRole,
} from "@/lib/auth/access";
import { getCurrentSessionContext } from "@/lib/auth/session";

type SidebarSection = {
  title: string;
  items: Array<{ href: Route; label: string; meta: string }>;
};

const sidebarMenus: Record<AppRole, SidebarSection[]> = {
  admin: [
    {
      title: "",
      items: [
        { href: "/customers", label: "Customers", meta: "" },
        { href: "/products", label: "Catalog", meta: "" },
        { href: "/orders", label: "Orders", meta: "" },
        { href: "/billing", label: "Billing", meta: "" },
        { href: "/billing/invoices", label: "Invoices", meta: "" },
      ],
    },
  ],
  inventory_manager: [
    {
      title: "OSS",
      items: [
        { href: "/inventory", label: "Inventory", meta: "" },
        { href: "/products", label: "My products", meta: "" },
        { href: "/orders", label: "My orders", meta: "" },
        { href: "/billing", label: "Billing", meta: "" },
        { href: "/notifications", label: "Alerts", meta: "" },
      ],
    },
  ],
  customer: [
    {
      title: "",
      items: [
        { href: "/my-services", label: "My services", meta: "" },
        { href: "/products", label: "Products", meta: "" },
        { href: "/orders", label: "Orders", meta: "" },
        { href: "/billing", label: "Billing", meta: "" },
        { href: "/documents", label: "Documents", meta: "" },
        { href: "/notifications", label: "Alerts", meta: "" },
      ],
    },
  ],
};

export async function Sidebar() {
  const session = await getCurrentSessionContext();
  const role = normalizeAppRole(session?.role, session?.permissions ?? []);
  const allowedSections = sidebarMenus[role]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canAccessAppPath(item.href, session?.role, session?.permissions ?? []),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="panel hidden w-[19rem] flex-col p-5 lg:flex">
      <div className="border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--ink),var(--accent-strong))] text-sm font-semibold text-white shadow-[0_16px_30px_rgba(8,23,36,0.16)]">
            TS
          </div>
          <div>
            <p className="accent-label text-[11px] font-semibold uppercase">
              TelecoSync
            </p>
            <h2 className="mt-1 text-lg font-semibold">Digital carrier core</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          A fixed-line platform centered on network inventory management, with
          supporting workflow, customer, and integration operations.
        </p>
      </div>
      <nav className="mt-5 space-y-5">
        {allowedSections.map((group, index) => (
          <div key={`${group.title}-${index}`}>
            {group.title ? (
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                {group.title}
              </p>
            ) : null}
            <div className="mt-3 space-y-2">
              {group.items.map((section) => (
                <Link
                  className="group flex items-center justify-between rounded-[22px] border border-transparent bg-[rgba(255,255,255,0.36)] px-4 py-3 text-sm transition hover:border-[var(--border)] hover:bg-white"
                  href={section.href}
                  key={section.href}
                >
                  <span className="font-medium text-[var(--ink)]">
                    {section.label}
                  </span>
                  {section.meta ? (
                    <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent-strong)]">
                      {section.meta}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
