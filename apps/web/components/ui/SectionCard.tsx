type SectionCardProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="space-y-2">
        <h2 className="display-title text-2xl font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
