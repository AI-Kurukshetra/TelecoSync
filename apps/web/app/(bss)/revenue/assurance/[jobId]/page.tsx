import { LiveRevenueAssuranceDetailPage } from "@/components/live/LiveBssPages";

export default function RevenueAssuranceDetailPage({
  params
}: {
  params: { jobId: string };
}) {
  return <LiveRevenueAssuranceDetailPage jobId={params.jobId} />;
}
