import { LiveAssetsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";
import { InventoryAssetManager } from "@/components/oss/InventoryManagers";

export default function InventoryAssetsPage() {
  return (
    <ModulePage
      eyebrow="OSS / Inventory / Assets"
      title="Asset inventory"
      description="Manage assigned and unassigned assets directly, with archive and delete controls."
      stats={[{ label: "Primary entities", value: "assets" }]}
    >
      <InventoryAssetManager />
      <LiveAssetsPanel />
    </ModulePage>
  );
}
