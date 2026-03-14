import { LiveWebhooksPanel } from "@/components/live/LiveDataPanels";
import { WebhookForm } from "@/components/integrations/WebhookForm";
import { ModulePage } from "@/components/layout/ModulePage";

export default function WebhooksPage() {
  return (
    <ModulePage
      eyebrow="Admin / Integrations / Webhooks"
      title="Webhook subscriptions"
      description="Outbound webhook subscriptions stay current as configuration changes."
      stats={[{ label: "Ingress", value: "webhooks" }]}
    >
      <WebhookForm />
      <LiveWebhooksPanel />
    </ModulePage>
  );
}
