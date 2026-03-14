import { LiveConfigurationPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function ConfigurationPage() {
  return (
    <ModulePage
      eyebrow="OSS / Configuration"
      title="Configuration management"
      description="Configuration targets stay current as records change."
      stats={[{ label: "Primary entities", value: "network_elements" }]}
    >
      <LiveConfigurationPanel />
    </ModulePage>
  );
}
