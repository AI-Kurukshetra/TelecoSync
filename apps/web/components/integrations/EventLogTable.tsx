import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type Stat = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
};

export function EventLogTable({ stats }: { stats: Stat[] }) {
  return (
    <SectionCard
      title="Event processing"
      description="Dispatcher backlog, source diversity, and event mix from the tenant event bus."
    >
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
