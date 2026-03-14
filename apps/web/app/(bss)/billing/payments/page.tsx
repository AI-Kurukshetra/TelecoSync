import { LivePaymentsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function BillingPaymentsPage() {
  return (
    <ModulePage
      eyebrow="BSS / Billing / Payments"
      title="Payments"
      description="Payments stay current as records change."
      stats={[{ label: "Gateways", value: "card / bank / wallet" }]}
    >
      <LivePaymentsPanel />
    </ModulePage>
  );
}
