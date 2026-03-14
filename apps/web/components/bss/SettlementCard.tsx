import { StatusPill } from "@/components/ui/StatusPill";
import { getStatusTone } from "@/components/live/live-utils";

type SettlementCardProps = {
  direction: string;
  partner: string;
  status: string;
  amount: string;
};

export function SettlementCard({
  direction,
  partner,
  status,
  amount
}: SettlementCardProps) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{partner}</h3>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {direction} settlement for {amount}
          </p>
        </div>
        <StatusPill label={status} tone={getStatusTone(status)} />
      </div>
    </article>
  );
}
