import { LiveProvisioningDetailPage } from "@/components/live/LiveOssPages";

export default function ProvisioningDetailPage({
  params
}: {
  params: { instanceId: string };
}) {
  return <LiveProvisioningDetailPage instanceId={params.instanceId} />;
}
