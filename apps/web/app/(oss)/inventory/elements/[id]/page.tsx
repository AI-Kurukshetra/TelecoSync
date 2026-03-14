import { LiveInventoryElementDetailPage } from "@/components/live/LiveOssPages";

export default function InventoryElementDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveInventoryElementDetailPage id={params.id} />;
}
