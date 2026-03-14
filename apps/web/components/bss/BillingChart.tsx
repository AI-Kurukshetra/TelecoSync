import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type BillingChartProps = {
  stats: Array<{ label: string; value: string; tone?: "default" | "accent" | "warning" }>;
  description?: string;
};

export function BillingChart({
  stats,
  description = "Current invoice, payment, and exposure signals derived from live billing records."
}: BillingChartProps) {
  return (
    <SectionCard title="Billing trend" description={description}>
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
