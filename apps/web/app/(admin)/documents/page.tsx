import { LiveDocumentsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function DocumentsPage() {
  return (
    <ModulePage
      eyebrow="Admin / Documents"
      title="Document management"
      description="Documents stay current as records change."
      stats={[{ label: "Storage", value: "Supabase Storage" }]}
    >
      <LiveDocumentsPanel />
    </ModulePage>
  );
}
