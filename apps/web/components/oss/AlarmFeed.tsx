import { StatusPill } from "@/components/ui/StatusPill";
import { getStatusTone } from "@/components/live/live-utils";

type AlarmFeedProps = {
  title: string;
  detail: string;
  severity: string;
};

export function AlarmFeed({ title, detail, severity }: AlarmFeedProps) {
  return (
    <div className="panel space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <StatusPill label={severity} tone={getStatusTone(severity)} />
      </div>
      <p className="text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}
