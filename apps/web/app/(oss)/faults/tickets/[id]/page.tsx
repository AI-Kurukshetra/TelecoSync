import { LiveFaultTicketDetailPage } from "@/components/live/LiveOssPages";

export default function FaultTicketDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveFaultTicketDetailPage id={params.id} />;
}
