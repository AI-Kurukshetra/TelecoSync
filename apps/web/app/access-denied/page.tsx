import Link from "next/link";
import type { Route } from "next";
import { Shell } from "@/components/layout/Shell";
import { getAllowedRoutePrefixes, getDefaultRouteForRole, getRoleGuide, normalizeAppRole } from "@/lib/auth/access";
import { getCurrentSessionContext } from "@/lib/auth/session";

type AccessDeniedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccessDeniedPage({ searchParams }: AccessDeniedPageProps) {
  const session = await getCurrentSessionContext();
  const params = searchParams ? await searchParams : {};
  const blockedPath = typeof params.from === "string" ? params.from : null;
  const roleKey = normalizeAppRole(session?.role, session?.permissions ?? []);
  const roleGuide = getRoleGuide(session?.role, session?.permissions ?? []);
  const allowedRoutes = getAllowedRoutePrefixes(session?.role, session?.permissions ?? []).filter((route) => route !== "/");
  const defaultRoute = getDefaultRouteForRole(session?.role, session?.permissions ?? []);

  return (
    <Shell title="Access denied">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-[28px] border border-[var(--border)] bg-white/70 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <p className="accent-label text-xs font-semibold uppercase">Route restricted</p>
          <h1 className="display-title mt-4 text-4xl font-semibold">This role cannot open that area.</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            {blockedPath
              ? `The route ${blockedPath} is not available for your current role.`
              : "The requested route is not available for your current role."}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <article className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Current role</p>
              <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{roleGuide.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{roleGuide.summary}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">{roleKey}</p>
            </article>
            <article className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Recommended start</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{roleGuide.focus}</p>
              <Link
                className="mt-4 inline-flex rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
                href={defaultRoute as Route}
              >
                Go to start page
              </Link>
            </article>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {allowedRoutes.map((route) => (
            <Link
              className="rounded-[22px] border border-[var(--border)] bg-white/60 px-5 py-4 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
              href={route as Route}
              key={route}
            >
              {route}
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
