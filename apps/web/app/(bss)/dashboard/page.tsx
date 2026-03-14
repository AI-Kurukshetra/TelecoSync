import { ModulePage } from "@/components/layout/ModulePage";
import { DataTable } from "@/components/ui/DataTable";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { getCurrentSessionContext } from "@/lib/auth/session";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { formatDateTime, getStatusTone } from "@/components/live/live-utils";

export default async function CustomerDashboardPage() {
  const session = await getCurrentSessionContext();

  if (!session?.tenantId || !session.customerId) {
    return (
      <ModulePage
        eyebrow="Customer / Dashboard"
        title="My services"
        description=""
        stats={[
          { label: "Services", value: "0" },
          { label: "Active", value: "0" },
          { label: "Pending", value: "0" },
          { label: "Suspended", value: "0" }
        ]}
      >
        <SectionCard title="Service inventory" description="No customer context is available for this login.">
          <p className="text-sm text-[var(--muted)]">This account is not linked to a customer record.</p>
        </SectionCard>
      </ModulePage>
    );
  }

  const supabase = adminTenantClient();
  const { data: services } = await supabase
    .from("service_instances")
    .select("id, product_id, network_element_id, status, activated_at, deactivated_at, created_at")
    .eq("tenant_id", session.tenantId)
    .eq("customer_id", session.customerId)
    .order("created_at", { ascending: false });

  const rows = services ?? [];
  const activeCount = rows.filter((service) => service.status === "active").length;
  const pendingCount = rows.filter((service) => service.status === "pending").length;
  const suspendedCount = rows.filter((service) => service.status === "suspended").length;

  return (
    <ModulePage
      eyebrow="Customer / Dashboard"
      title="My services"
      description=""
      stats={[
        { label: "Services", value: String(rows.length) },
        { label: "Active", value: String(activeCount) },
        { label: "Pending", value: String(pendingCount) },
        { label: "Suspended", value: String(suspendedCount) }
      ]}
    >
      <SectionCard title="Service inventory" description="Only services linked to the signed-in customer account appear here.">
        <DataTable
          columns={["Service", "Product", "Network element", "Status", "Activated", "Ended"]}
          rows={rows.map((service) => [
            service.id,
            service.product_id ?? "—",
            service.network_element_id ?? "—",
            <StatusPill key={`${service.id}-status`} label={service.status} tone={getStatusTone(service.status)} />,
            formatDateTime(service.activated_at),
            formatDateTime(service.deactivated_at)
          ])}
          emptyMessage="No services are linked to this customer yet."
        />
      </SectionCard>
    </ModulePage>
  );
}
