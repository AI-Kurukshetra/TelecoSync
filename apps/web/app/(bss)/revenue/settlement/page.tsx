import { LiveSettlementPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function RevenueSettlementPage() {
  return (
    <ModulePage
      eyebrow="BSS / Revenue / Settlement"
      title="Settlement statements"
      description="Settlement statements stay current as records change."
      stats={[{ label: "Primary entities", value: "settlement_statements" }]}
    >
      <LiveSettlementPanel />
    </ModulePage>
  );
}
