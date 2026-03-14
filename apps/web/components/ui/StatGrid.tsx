type Stat = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
};

const toneMap = {
  default: "text-[var(--ink)]",
  accent: "text-[var(--accent)]",
  warning: "text-[var(--warning)]"
} as const;

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article className="panel p-5" key={stat.label}>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {stat.label}
          </p>
          <p className={`mt-3 text-2xl font-semibold ${toneMap[stat.tone ?? "default"]}`}>
            {stat.value}
          </p>
        </article>
      ))}
    </div>
  );
}
