import { LiveSlaDetailPage } from "@/components/live/LiveBssPages";

export default function SlaDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveSlaDetailPage id={params.id} />;
}
