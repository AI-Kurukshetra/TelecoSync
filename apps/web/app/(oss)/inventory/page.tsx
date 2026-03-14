import {
  LiveAssetsPanel,
  LiveElementsPanel,
  LiveInterfacesPanel
} from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";
import {
  InventoryAssetManager,
  InventoryElementManager,
  InventoryInterfaceManager
} from "@/components/oss/InventoryManagers";

export default function InventoryPage() {
  return (
    <ModulePage
      eyebrow="OSS / Inventory"
      title="Network inventory control"
      description="Use this screen as the main operating surface for network elements, interfaces, and assets."
      stats={[{ label: "Primary entities", value: "network inventory" }]}
    >
      <InventoryElementManager />
      <LiveElementsPanel />
      <InventoryInterfaceManager />
      <LiveInterfacesPanel />
      <InventoryAssetManager />
      <LiveAssetsPanel />
    </ModulePage>
  );
}
