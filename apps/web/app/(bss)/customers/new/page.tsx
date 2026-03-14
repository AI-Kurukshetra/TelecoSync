import { CustomerCreateForm } from "@/components/bss/CustomerCreateForm";
import { ModulePage } from "@/components/layout/ModulePage";
import { SectionCard } from "@/components/ui/SectionCard";

export default function NewCustomerPage() {
  return (
    <ModulePage
      eyebrow="BSS / Customer / Create"
      title="Create customer"
      description="Capture subscriber identity, account attributes, contacts, and onboarding defaults before downstream order creation."
      stats={[
        { label: "Validation", value: "Zod" },
        { label: "Next step", value: "Create account" },
        { label: "Record type", value: "Customer" }
      ]}
    >
      <SectionCard title="Customer form" description="Creates a tenant-scoped customer record and redirects to the profile.">
        <CustomerCreateForm />
      </SectionCard>
    </ModulePage>
  );
}
