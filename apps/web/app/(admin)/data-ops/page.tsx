import { DataOpsPanel } from "@/components/admin/DataOpsPanel";
import { ModulePage } from "@/components/layout/ModulePage";

export default function DataOpsPage() {
  return (
    <ModulePage
      eyebrow="Admin / Data Ops"
      title="Bulk data operations"
      description="Run tenant-scoped CSV imports and exports for catalog seeding, audit extracts, and controlled data exchange."
      stats={[
        { label: "Import", value: "customers, products, network_elements" },
        { label: "Export", value: "CSV extracts" },
        { label: "Audit", value: "event_log backed" }
      ]}
    >
      <DataOpsPanel />
    </ModulePage>
  );
}
