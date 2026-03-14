import { LiveInvoicesPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function BillingInvoicesPage() {
  return (
    <ModulePage
      eyebrow="BSS / Billing / Invoices"
      title="Invoice management"
      description="Invoices stay current as records change."
      stats={[]}
    >
      <LiveInvoicesPanel />
    </ModulePage>
  );
}
