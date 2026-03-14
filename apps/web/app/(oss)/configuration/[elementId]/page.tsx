import { LiveConfigurationDetailPage } from "@/components/live/LiveOssPages";

export default function ConfigurationDetailPage({
  params
}: {
  params: { elementId: string };
}) {
  return <LiveConfigurationDetailPage elementId={params.elementId} />;
}
