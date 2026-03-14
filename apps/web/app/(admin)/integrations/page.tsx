import {
  LiveApiRegistryPanel,
  LiveConnectorsPanel,
  LiveEventBusPanel,
  LiveWebhooksPanel
} from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function IntegrationsPage() {
  return (
    <ModulePage
      eyebrow="Admin / Integrations"
      title="Integration framework"
      description="Connectors, registry entries, event flow, and webhook subscriptions stay current as records change."
      stats={[{ label: "Execution", value: "integration-dispatcher" }]}
    >
      <LiveConnectorsPanel />
      <LiveApiRegistryPanel />
      <LiveWebhooksPanel />
      <LiveEventBusPanel />
    </ModulePage>
  );
}
