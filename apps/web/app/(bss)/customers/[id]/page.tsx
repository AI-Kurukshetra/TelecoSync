import { LiveCustomerDetailPage } from "@/components/live/LiveBssPages";

export default function CustomerDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveCustomerDetailPage id={params.id} />;
}
