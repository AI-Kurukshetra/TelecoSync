import { LivePerformancePanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function PerformancePage() {
  return (
    <ModulePage
      eyebrow="OSS / Performance"
      title="Performance monitoring"
      description="Performance metrics stay current as records change."
      stats={[{ label: "Primary entities", value: "performance_metrics" }]}
    >
      <LivePerformancePanel />
    </ModulePage>
  );
}
