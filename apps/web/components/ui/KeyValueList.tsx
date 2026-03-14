type KeyValueListProps = {
  items: Array<{ label: string; value: string }>;
};

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
          key={item.label}
        >
          <dt className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {item.label}
          </dt>
          <dd className="mt-2 text-sm font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
