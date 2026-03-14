import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type Stat = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
};

export function InvoiceTable({ stats }: { stats: Stat[] }) {
  return (
    <SectionCard
      title="Invoice health"
      description="Collection state and outstanding exposure for the selected customer bill."
    >
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
