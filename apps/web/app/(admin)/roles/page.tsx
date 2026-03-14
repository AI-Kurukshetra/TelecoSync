import { LiveRolesPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function RolesPage() {
  return (
    <ModulePage
      eyebrow="Admin / Roles"
      title="Role matrix"
      description="Roles stay current as records change."
      stats={[{ label: "Scope", value: "tenant-specific" }]}
    >
      <LiveRolesPanel />
    </ModulePage>
  );
}
