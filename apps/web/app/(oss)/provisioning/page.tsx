import { LiveProvisioningPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function ProvisioningPage() {
  return (
    <ModulePage
      eyebrow="OSS / Provisioning"
      title="Service provisioning"
      description="Service instances stay current as records change."
      stats={[{ label: "Primary entities", value: "service_instances" }]}
    >
      <LiveProvisioningPanel />
    </ModulePage>
  );
}
