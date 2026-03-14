import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type Stat = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
};

export function TicketList({ stats }: { stats: Stat[] }) {
  return (
    <SectionCard
      title="Ticket posture"
      description="Live severity and resolution signals from the tenant fault queue."
    >
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
