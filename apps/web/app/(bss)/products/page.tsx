import { LiveProductsPanel } from "@/components/live/LiveDataPanels";
import { ModulePage } from "@/components/layout/ModulePage";

export default function ProductsPage() {
  return (
    <ModulePage
      eyebrow="BSS / Catalog"
      title="Product catalog"
      description="The product catalog stays current as records change."
      stats={[]}
    >
      <LiveProductsPanel />
    </ModulePage>
  );
}
