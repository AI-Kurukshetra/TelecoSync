type BreadcrumbNavProps = {
  items: string[];
};

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
      {items.map((item, index) => (
        <span className="flex items-center gap-2" key={`${item}-${index}`}>
          {index > 0 ? <span className="text-[var(--signal)]">/</span> : null}
          <span>{item}</span>
        </span>
      ))}
    </nav>
  );
}
