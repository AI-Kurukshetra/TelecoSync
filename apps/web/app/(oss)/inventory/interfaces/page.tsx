import { LiveInterfacesPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";
import { InventoryInterfaceManager } from "@/components/oss/InventoryManagers";

export default function InventoryInterfacesPage() {
  return (
    <ModulePage
      eyebrow="OSS / Inventory / Interfaces"
      title="Network interfaces"
      description="Manage interface records directly, including create, update, archive, and delete actions."
      stats={[{ label: "Primary entities", value: "network_interfaces" }]}
    >
      <InventoryInterfaceManager />
      <LiveInterfacesPanel />
    </ModulePage>
  );
}
