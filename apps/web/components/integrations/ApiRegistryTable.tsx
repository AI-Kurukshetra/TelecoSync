import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type Stat = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
};

export function ApiRegistryTable({ stats }: { stats: Stat[] }) {
  return (
    <SectionCard
      title="Registry snapshot"
      description="Coverage across registered APIs for this tenant."
    >
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
