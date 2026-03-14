import { LiveApiRegistryPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function ApiRegistryPage() {
  return (
    <ModulePage
      eyebrow="Admin / Integrations / Registry"
      title="API registry"
      description="The API registry stays current as definitions change."
      stats={[{ label: "Auth", value: "bearer / custom" }]}
    >
      <LiveApiRegistryPanel />
    </ModulePage>
  );
}
