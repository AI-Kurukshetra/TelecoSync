import { LiveAlarmsPanel, LiveTicketsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function FaultsPage() {
  return (
    <ModulePage
      eyebrow="OSS / Faults"
      title="Fault management"
      description="Trouble tickets and alarms stay current as records change."
      stats={[{ label: "Execution", value: "fault-detector" }]}
    >
      <LiveTicketsPanel />
      <LiveAlarmsPanel />
    </ModulePage>
  );
}
