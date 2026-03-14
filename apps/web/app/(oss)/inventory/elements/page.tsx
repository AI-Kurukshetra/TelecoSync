import { LiveElementsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";
import { InventoryElementManager } from "@/components/oss/InventoryManagers";

export default function InventoryElementsPage() {
  return (
    <ModulePage
      eyebrow="OSS / Inventory / Elements"
      title="Network elements"
      description="Create, update, archive, and delete network elements from the primary inventory surface."
      stats={[{ label: "Topology", value: "inventory-backed" }]}
    >
      <InventoryElementManager />
      <LiveElementsPanel />
    </ModulePage>
  );
}
