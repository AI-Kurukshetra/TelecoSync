import { LiveAnalyticsPanel } from "@/components/live/LiveDataPanels";

export default function AnalyticsPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Analytics</p>
        <h1 className="text-4xl font-semibold tracking-tight">Unified KPI dashboard</h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
          KPI cards stay current as operational and commercial activity changes.
        </p>
      </div>
      <LiveAnalyticsPanel />
    </section>
  );
}
