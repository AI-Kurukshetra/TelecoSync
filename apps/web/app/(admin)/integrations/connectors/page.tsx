import { LiveConnectorsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function ConnectorsPage() {
  return (
    <ModulePage
      eyebrow="Admin / Integrations / Connectors"
      title="Connector library"
      description="Connector activity stays current as jobs run."
      stats={[{ label: "Execution", value: "integration-dispatcher" }]}
    >
      <LiveConnectorsPanel />
    </ModulePage>
  );
}
