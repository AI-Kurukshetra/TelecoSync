import { LiveCustomerInvoicesPage } from "@/components/live/LiveBssPages";

export default function CustomerInvoicesPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveCustomerInvoicesPage id={params.id} />;
}
