import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type RevenueAssurancePanelProps = {
  stats: Array<{ label: string; value: string; tone?: "default" | "accent" | "warning" }>;
  description?: string;
};

export function RevenueAssurancePanel({
  stats,
  description = "Leakage, discrepancy pressure, and close-period posture from live assurance processing."
}: RevenueAssurancePanelProps) {
  return (
    <SectionCard title="Revenue assurance" description={description}>
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
