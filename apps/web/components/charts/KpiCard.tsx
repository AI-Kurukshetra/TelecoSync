export function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="panel metric-glow p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{title}</p>
        <span className="signal-dot" />
      </div>
      <p className="mt-4 text-3xl font-semibold leading-none">{value}</p>
    </article>
  );
}
