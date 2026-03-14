import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type NetworkMapProps = {
  stats: Array<{ label: string; value: string; tone?: "default" | "accent" | "warning" }>;
};

export function NetworkMap({ stats }: NetworkMapProps) {
  return (
    <SectionCard title="Network topology summary" description="Live inventory posture for the selected network element and its attached resources.">
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
