import { LiveReportsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function RevenueReportsPage() {
  return (
    <ModulePage
      eyebrow="BSS / Revenue / Reports"
      title="Financial reports"
      description="Financial reports stay current as records change."
      stats={[{ label: "Storage", value: "payload_json" }]}
    >
      <LiveReportsPanel />
    </ModulePage>
  );
}
