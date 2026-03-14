import { LiveRevenueAssurancePanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function RevenueAssuranceListPage() {
  return (
    <ModulePage
      eyebrow="BSS / Revenue / Assurance"
      title="Revenue assurance jobs"
      description="Revenue assurance jobs stay current as records change."
      stats={[{ label: "Processor", value: "revenue-assurance" }]}
    >
      <LiveRevenueAssurancePanel />
    </ModulePage>
  );
}
