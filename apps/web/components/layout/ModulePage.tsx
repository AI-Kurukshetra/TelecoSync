type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  stats?: Array<{ label: string; value: string }>;
  children?: React.ReactNode;
};

export function ModulePage({
  eyebrow,
  title,
  description,
  stats = [],
  children
}: ModulePageProps) {
  return (
    <section className="space-y-8">
      <div className="space-y-5">
        <p className="accent-label text-xs font-semibold uppercase">
          {eyebrow}
        </p>
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="display-title text-4xl font-semibold leading-none sm:text-5xl">{title}</h1>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              <span className="signal-dot" />
              Digital carrier platform
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.length > 0 ? (
          stats.map((stat) => (
            <article className="panel metric-glow p-5" key={stat.label}>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                {stat.label}
              </p>
              <p className="mt-4 text-3xl font-semibold leading-none">{stat.value}</p>
            </article>
          ))
        ) : (
          <article className="panel p-5 md:col-span-2 xl:col-span-4">
            <p className="text-sm leading-6 text-[var(--muted)]">No module statistics were provided for this screen.</p>
          </article>
        )}
      </div>
      {children}
    </section>
  );
}
