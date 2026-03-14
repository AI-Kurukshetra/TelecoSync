import { LiveBillingOverviewPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function BillingPage() {
  return (
    <ModulePage
      eyebrow="BSS / Billing"
      title="Billing operations"
      description=""
      stats={[]}
    >
      <LiveBillingOverviewPanel />
    </ModulePage>
  );
}
