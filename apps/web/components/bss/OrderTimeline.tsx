type OrderTimelineProps = {
  steps: string[];
};

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="panel p-5">
      <h3 className="text-lg font-semibold">Order timeline</h3>
      <ol className="mt-4 space-y-3 text-sm text-[var(--muted)]">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
