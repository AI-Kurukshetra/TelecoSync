import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type Stat = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
};

export function ConnectorCard({ stats }: { stats: Stat[] }) {
  return (
    <SectionCard
      title="Connector health"
      description="Availability, run status, and connector mix across the integration library."
    >
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
