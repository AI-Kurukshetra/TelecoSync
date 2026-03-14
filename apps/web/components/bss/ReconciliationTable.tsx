import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type Stat = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
};

export function ReconciliationTable({ stats }: { stats: Stat[] }) {
  return (
    <SectionCard
      title="Close summary"
      description="Approval state and latest financial close signals from reconciliation activity."
    >
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
