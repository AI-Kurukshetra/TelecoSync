import { LiveOrdersPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function OrdersPage() {
  return (
    <ModulePage
      eyebrow="BSS / Fulfilment"
      title="Order management"
      description=""
      stats={[]}
    >
      <LiveOrdersPanel />
    </ModulePage>
  );
}
