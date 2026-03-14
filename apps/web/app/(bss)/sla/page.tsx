import { LiveSlaPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function SlaPage() {
  return (
    <ModulePage
      eyebrow="BSS / SLA"
      title="SLA management"
      description="SLAs stay current as records change."
      stats={[]}
    >
      <LiveSlaPanel />
    </ModulePage>
  );
}
