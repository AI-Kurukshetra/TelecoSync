import { LiveReconciliationPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function RevenueReconciliationPage() {
  return (
    <ModulePage
      eyebrow="BSS / Revenue / Reconciliation"
      title="Reconciliation runs"
      description="Reconciliation runs stay current as records change."
      stats={[{ label: "Primary entities", value: "reconciliation_runs" }]}
    >
      <LiveReconciliationPanel />
    </ModulePage>
  );
}
