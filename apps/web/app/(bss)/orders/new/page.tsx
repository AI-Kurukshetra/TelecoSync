import { OrderCreateForm } from "@/components/bss/OrderCreateForm";
import { ModulePage } from "@/components/layout/ModulePage";
import { SectionCard } from "@/components/ui/SectionCard";

export default function NewOrderPage() {
  return (
    <ModulePage
      eyebrow="BSS / Orders / Create"
      title="Create order"
      description="Capture requested products, requested start date, service actions, and fulfilment inputs for a new product order."
      stats={[
        { label: "Record type", value: "Order" },
        { label: "Workflow", value: "Auto trigger" }
      ]}
    >
      <SectionCard title="Order form" description="Creates an order with a product item and redirects to the order detail view.">
        <OrderCreateForm />
      </SectionCard>
    </ModulePage>
  );
}
