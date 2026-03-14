import { StatusPill } from "@/components/ui/StatusPill";
import { getStatusTone } from "@/components/live/live-utils";

type SlaStatusProps = {
  headline: string;
  detail: string;
  status: string;
};

export function SlaStatus({ headline, detail, status }: SlaStatusProps) {
  return (
    <div className="panel flex items-center justify-between p-5">
      <div>
        <h3 className="text-lg font-semibold">{headline}</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
      </div>
      <StatusPill label={status} tone={getStatusTone(status)} />
    </div>
  );
}
