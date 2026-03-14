import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type PerformanceChartProps = {
  stats: Array<{ label: string; value: string; tone?: "default" | "accent" | "warning" }>;
};

export function PerformanceChart({ stats }: PerformanceChartProps) {
  return (
    <SectionCard title="Performance trend summary" description="Live performance samples condensed into operational indicators for the selected element.">
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
