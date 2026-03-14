import { LiveRevenueSettlementDetailPage } from "@/components/live/LiveBssPages";

export default function RevenueSettlementDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveRevenueSettlementDetailPage id={params.id} />;
}
