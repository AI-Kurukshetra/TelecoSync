import { LiveAuditPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function AuditPage() {
  return (
    <ModulePage
      eyebrow="Admin / Audit"
      title="Audit trail"
      description="Audit records stay current as records change."
      stats={[{ label: "Primary entities", value: "audit_logs" }]}
    >
      <LiveAuditPanel />
    </ModulePage>
  );
}
