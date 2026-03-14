import { getCurrentSessionContext } from "@/lib/auth/session";
import { getRoleGuide, normalizeAppRole } from "@/lib/auth/access";
import { NotificationInbox } from "@/components/layout/NotificationInbox";
import { SignOutButton } from "@/components/layout/SignOutButton";

export async function Header() {
  const session = await getCurrentSessionContext();
  const currentRole = session ? getRoleGuide(session.role, session.permissions) : null;
  const currentRoleKey = session ? normalizeAppRole(session.role, session.permissions) : null;

  return (
    <header className="panel grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="min-w-0 space-y-2">
        <p className="accent-label text-[11px] font-semibold uppercase">
          {session ? "Live tenant context" : "Unauthenticated"}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="display-title text-2xl font-semibold">TelecoSync workspace</h3>
          {session ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              <span className="signal-dot" />
              Tenant context locked
            </span>
          ) : null}
        </div>
        <p className="text-sm text-[var(--muted)]">
          {session
            ? `${session.fullName ?? session.email ?? "Operator"} • ${session.tenantSlug ?? session.tenantId}${currentRole ? ` • ${currentRole.summary}` : ""}`
            : "Authentication, tenant scoping, and the three-role access model are enforced in middleware and route handlers."}
        </p>
      </div>
      {session ? (
        <div className="flex flex-wrap items-stretch gap-3 lg:justify-self-end">
          <div className="metric-glow min-w-[8rem] rounded-[22px] border border-[var(--border)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Role</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{currentRoleKey ?? "member"}</p>
          </div>
          <div className="metric-glow min-w-[10rem] rounded-[22px] border border-[var(--border)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Tenant</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{session.tenantSlug ?? session.tenantId}</p>
          </div>
          <div className="min-w-[9rem]">
            <NotificationInbox tenantId={session.tenantId} userId={session.userId} />
          </div>
          <SignOutButton />
        </div>
      ) : null}
    </header>
  );
}
