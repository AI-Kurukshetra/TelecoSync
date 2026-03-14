import { LiveEventBusPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function IntegrationEventsPage() {
  return (
    <ModulePage
      eyebrow="Admin / Integrations / Events"
      title="Event bus"
      description="The event bus stays current as activity changes."
      stats={[]}
    >
      <LiveEventBusPanel />
    </ModulePage>
  );
}
