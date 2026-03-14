import { LiveTicketsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function FaultTicketsPage() {
  return (
    <ModulePage
      eyebrow="OSS / Faults / Tickets"
      title="Trouble tickets"
      description="Trouble tickets stay current as records change."
      stats={[{ label: "Primary entities", value: "trouble_tickets" }]}
    >
      <LiveTicketsPanel />
    </ModulePage>
  );
}
