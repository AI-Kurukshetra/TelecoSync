import { LiveCustomersPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function CustomersPage() {
  return (
    <ModulePage
      eyebrow="BSS / Customer"
      title="Customer management"
      description="Customer records stay current as records change."
      stats={[]}
    >
      <LiveCustomersPanel />
    </ModulePage>
  );
}
