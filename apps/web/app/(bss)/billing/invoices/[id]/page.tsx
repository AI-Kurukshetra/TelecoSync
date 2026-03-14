import { LiveBillingInvoiceDetailPage } from "@/components/live/LiveBssPages";

export default function BillingInvoiceDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveBillingInvoiceDetailPage id={params.id} />;
}
