import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/ui/StatGrid";

type Stat = {
  label: string;
  value: string;
  tone?: "default" | "accent" | "warning";
};

export function DeliveryLog({
  title = "Delivery health",
  description,
  stats
}: {
  title?: string;
  description: string;
  stats: Stat[];
}) {
  return (
    <SectionCard title={title} description={description}>
      <StatGrid stats={stats} />
    </SectionCard>
  );
}
