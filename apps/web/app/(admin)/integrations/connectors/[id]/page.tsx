import { LiveConnectorDetailPage } from "@/components/live/LiveAdminPages";

export default function ConnectorDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveConnectorDetailPage id={params.id} />;
}
