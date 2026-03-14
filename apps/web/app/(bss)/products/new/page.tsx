import { ProductCreateForm } from "@/components/bss/ProductCreateForm";
import { ModulePage } from "@/components/layout/ModulePage";
import { SectionCard } from "@/components/ui/SectionCard";

export default function NewProductPage() {
  return (
    <ModulePage
      eyebrow="BSS / Catalog / Create"
      title="Create product offering"
      description="Define catalog attributes, pricing, lifecycle, billing cycle, and validity windows for a new product."
      stats={[
        { label: "Record type", value: "Product" },
        { label: "Lifecycle", value: "Active" }
      ]}
    >
      <SectionCard title="Product form" description="Creates a catalog entry and redirects to the product detail view.">
        <ProductCreateForm />
      </SectionCard>
    </ModulePage>
  );
}
