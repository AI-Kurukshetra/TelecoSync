import { LiveRatingRulesPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function BillingRatingRulesPage() {
  return (
    <ModulePage
      eyebrow="BSS / Billing / Rating Rules"
      title="Rating rules"
      description="Rating rules stay current as records change."
      stats={[{ label: "Primary entities", value: "rating_rules" }]}
    >
      <LiveRatingRulesPanel />
    </ModulePage>
  );
}
