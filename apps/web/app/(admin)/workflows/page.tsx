import { LiveWorkflowsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function WorkflowsPage() {
  return (
    <ModulePage
      eyebrow="Admin / Workflows"
      title="Workflow registry"
      description="Workflows stay current as records change."
      stats={[{ label: "Execution", value: "Edge function" }]}
    >
      <LiveWorkflowsPanel />
    </ModulePage>
  );
}
