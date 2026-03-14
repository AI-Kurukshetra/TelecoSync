import { LiveApiRegistryDetailPage } from "@/components/live/LiveAdminPages";

export default function ApiRegistryDetailPage({
  params
}: {
  params: { apiId: string };
}) {
  return <LiveApiRegistryDetailPage apiId={params.apiId} />;
}
