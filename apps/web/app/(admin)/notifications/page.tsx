import { LiveNotificationsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function NotificationsPage() {
  return (
    <ModulePage
      eyebrow="Admin / Notifications"
      title="Notification control"
      description="Notifications stay current as records change."
    >
      <LiveNotificationsPanel />
    </ModulePage>
  );
}
