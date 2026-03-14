import { LiveWebhookDetailPage } from "@/components/live/LiveAdminPages";

export default function WebhookDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <LiveWebhookDetailPage id={params.id} />;
}
