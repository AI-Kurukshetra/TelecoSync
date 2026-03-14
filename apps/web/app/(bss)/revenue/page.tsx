import {
  LiveReconciliationPanel,
  LiveReportsPanel,
  LiveRevenueAssurancePanel,
  LiveSettlementPanel
} from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function RevenuePage() {
  return (
    <ModulePage
      eyebrow="BSS / Revenue"
      title="Revenue management"
      description="Revenue assurance, reconciliation, settlement, and reports stay current as records change."
      stats={[{ label: "Execution", value: "revenue-assurance-processor" }]}
    >
      <LiveRevenueAssurancePanel />
      <LiveReconciliationPanel />
      <LiveSettlementPanel />
      <LiveReportsPanel />
    </ModulePage>
  );
}
