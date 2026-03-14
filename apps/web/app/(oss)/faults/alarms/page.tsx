import { LiveAlarmsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function FaultAlarmsPage() {
  return (
    <ModulePage
      eyebrow="OSS / Faults / Alarms"
      title="Alarm feed"
      description="Alarms stay current as records change."
      stats={[{ label: "Stream", value: "alarm intake" }]}
    >
      <LiveAlarmsPanel />
    </ModulePage>
  );
}
