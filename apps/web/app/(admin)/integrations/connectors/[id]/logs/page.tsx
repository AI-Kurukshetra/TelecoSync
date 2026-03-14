import { LiveConnectorLogsPage } from "@/components/live/LiveAdminPages";

export default function ConnectorLogsPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveConnectorLogsPage id={params.id} />;
}
