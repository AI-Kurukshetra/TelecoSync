import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid-background min-h-screen px-4 py-8 lg:px-8 lg:py-10">
      <section className="mx-auto max-w-[96rem] space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel relative overflow-hidden p-8 lg:p-12">
            <img
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-auto -right-12 top-0 z-0 w-[46rem] max-w-none opacity-90"
              src="/media/landing-clip.svg"
            />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(255,251,245,0.96)_0%,rgba(255,251,245,0.88)_42%,rgba(255,251,245,0.48)_72%,rgba(255,251,245,0.14)_100%)]" />
            <div className="relative z-10 flex flex-wrap items-center gap-3">
              <p className="accent-label text-xs font-semibold uppercase">
                Telecom Workspace
              </p>
              <span className="rounded-full border border-[var(--border)] bg-white/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Fixed-line first
              </span>
            </div>
            <h1 className="relative z-10 display-title mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] lg:text-7xl">
              Understand the product in minutes and test the core flows without guessing where to start.
            </h1>
            <p className="relative z-10 mt-6 max-w-3xl text-base leading-7 text-[var(--muted)]">
              TelecoSync is organized around four simple ideas: manage customers and billing, link services to network inventory, automate core operator workflows, and expose everything through events and integrations.
            </p>
            <div className="relative z-10 mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(8,23,36,0.18)]"
                href="/register"
              >
                Start with tenant registration
              </Link>
              <Link
                className="rounded-full border border-[var(--border)] bg-white/70 px-5 py-3 text-sm font-semibold"
                href="/login"
              >
                Sign in to workspace
              </Link>
            </div>
            <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-3">
              <article className="metric-glow rounded-[24px] border border-[var(--border)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Business flow</p>
                <p className="mt-2 text-3xl font-semibold">Customer to bill</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Customers, products, orders, invoices, and payments.</p>
              </article>
              <article className="metric-glow rounded-[24px] border border-[var(--border)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Operations flow</p>
                <p className="mt-2 text-3xl font-semibold">Inventory to service</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Elements, interfaces, assets, provisioning, and service instances.</p>
              </article>
              <article className="metric-glow rounded-[24px] border border-[var(--border)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Platform flow</p>
                <p className="mt-2 text-3xl font-semibold">Event driven</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Workflows, webhooks, connectors, audit, and tenant isolation.</p>
              </article>
            </div>
          </div>

          <article className="panel p-6 lg:p-7">
            <p className="accent-label text-[11px] font-semibold uppercase">Product Focus</p>
            <h2 className="display-title mt-3 text-3xl font-semibold">Built for fast evaluation</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              The landing page now points directly to the main product areas so users can understand the product model and open the correct screen immediately.
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] border border-[var(--border)] bg-white/62 p-4">
                <p className="text-sm font-semibold">What the app does</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  TelecoSync helps operators manage customer onboarding, product ordering, billing, network inventory, provisioning-lite workflows, and outbound integrations in one workspace.
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-white/62 p-4">
                <p className="text-sm font-semibold">How to read the product</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  BSS covers the commercial flow, OSS covers infrastructure and activation, Admin covers control and workflow, and Integrations covers events and system connectivity.
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-white/62 p-4">
                <p className="text-sm font-semibold">Where to begin</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Use the quick access links to jump straight into the area you want to evaluate instead of following a forced sequence.
                </p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
