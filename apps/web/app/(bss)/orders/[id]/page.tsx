import { LiveOrderDetailPage } from "@/components/live/LiveBssPages";

export default function OrderDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveOrderDetailPage id={params.id} />;
}
