import { StatusPill } from "@/components/ui/StatusPill";
import { getStatusTone } from "@/components/live/live-utils";

type CustomerCardProps = {
  name: string;
  subtitle: string;
  status: string;
};

export function CustomerCard({ name, subtitle, status }: CustomerCardProps) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        <StatusPill label={status} tone={getStatusTone(status)} />
      </div>
    </article>
  );
}
