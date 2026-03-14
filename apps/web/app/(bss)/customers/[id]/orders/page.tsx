import { LiveCustomerOrdersPage } from "@/components/live/LiveBssPages";

export default function CustomerOrdersPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveCustomerOrdersPage id={params.id} />;
}
