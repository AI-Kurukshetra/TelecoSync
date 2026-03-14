import { LiveCustomerAccountsPage } from "@/components/live/LiveBssPages";

export default function CustomerAccountsPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveCustomerAccountsPage id={params.id} />;
}
