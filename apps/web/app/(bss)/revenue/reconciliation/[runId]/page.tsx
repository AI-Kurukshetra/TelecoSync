import { LiveRevenueReconciliationDetailPage } from "@/components/live/LiveBssPages";

export default function RevenueReconciliationDetailPage({
  params
}: {
  params: { runId: string };
}) {
  return <LiveRevenueReconciliationDetailPage runId={params.runId} />;
}
