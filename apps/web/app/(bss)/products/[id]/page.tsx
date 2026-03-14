import { LiveProductDetailPage } from "@/components/live/LiveBssPages";

export default function ProductDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveProductDetailPage id={params.id} />;
}
