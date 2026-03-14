import { LivePerformanceDetailPage } from "@/components/live/LiveOssPages";

export default function PerformanceDetailPage({
  params
}: {
  params: { elementId: string };
}) {
  return <LivePerformanceDetailPage elementId={params.elementId} />;
}
