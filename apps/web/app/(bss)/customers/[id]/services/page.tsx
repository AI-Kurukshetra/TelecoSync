import { LiveCustomerServicesPage } from "@/components/live/LiveBssPages";

export default function CustomerServicesPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveCustomerServicesPage id={params.id} />;
}
