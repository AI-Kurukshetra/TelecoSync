import { LiveTenantsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function TenantsPage() {
  return (
    <ModulePage
      eyebrow="Admin / Tenants"
      title="Tenant management"
      description="Tenant metadata stays current as records change."
      stats={[{ label: "Critical", value: "RLS root context" }]}
    >
      <LiveTenantsPanel />
    </ModulePage>
  );
}
