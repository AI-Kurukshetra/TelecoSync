"use client";

import Link from "next/link";
import { CustomerCard } from "@/components/bss/CustomerCard";
import { InvoiceTable } from "@/components/bss/InvoiceTable";
import { OrderTimeline } from "@/components/bss/OrderTimeline";
import { ReconciliationTable } from "@/components/bss/ReconciliationTable";
import { RevenueAssurancePanel } from "@/components/bss/RevenueAssurancePanel";
import { SettlementCard } from "@/components/bss/SettlementCard";
import { SlaStatus } from "@/components/bss/SlaStatus";
import { ModulePage } from "@/components/layout/ModulePage";
import { DataTable } from "@/components/ui/DataTable";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  ErrorModulePage,
  LoadingModulePage,
  NotFoundModulePage,
  formatDateTime,
  formatMoney,
  formatPercent,
  formatValue,
  getQueryErrorMessage,
  getStatusTone,
  useLiveRestCollection,
  useLiveRestResource
} from "@/components/live/live-utils";

type CustomerRecord = {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status: string;
  createdAt?: string | null;
};

type AccountRecord = {
  id: string;
  customer_id: string;
  account_type: string;
  status: string;
  credit_limit?: number | null;
  balance?: number | null;
  currency?: string | null;
};

type CustomerOrderRecord = {
  id: string;
  order_number?: string;
  order_type: string;
  status: string;
  total_amount?: number | null;
  currency?: string | null;
  created_at?: string | null;
  fulfilled_at?: string | null;
};

type ServiceRecord = {
  id: string;
  customer_id?: string | null;
  product_id?: string | null;
  network_element_id?: string | null;
  status: string;
  activated_at?: string | null;
  deactivated_at?: string | null;
  config_json?: unknown;
};

type ProductRecord = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  billingCycle?: string | null;
  lifecycleStatus?: string | null;
  version?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
};

type PromotionRecord = {
  id: string;
  name: string;
  discount_type: string;
  discount_value?: number | null;
  valid_to?: string | null;
};

type OrderRecord = {
  id: string;
  orderNumber: string;
  customerId: string;
  accountId?: string | null;
  orderType: string;
  status: string;
  items?: Array<Record<string, unknown>>;
  totalAmount?: number | null;
  currency?: string | null;
  requestedStartDate?: string | null;
  completionDate?: string | null;
};

type WorkOrderRecord = {
  id: string;
  order_id?: string | null;
  type: string;
  status: string;
  due_date?: string | null;
  assigned_to?: string | null;
};

type InvoiceRecord = {
  id: string;
  accountId: string;
  invoiceNumber: string;
  billingPeriod: {
    startDateTime?: string | null;
    endDateTime?: string | null;
  };
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  status: string;
  dueDate?: string | null;
  paidAt?: string | null;
};

type PaymentRecord = {
  id: string;
  invoice_id: string;
  amount?: number | null;
  currency?: string | null;
  method?: string | null;
  status: string;
  paid_at?: string | null;
};

type RevenueJobRecord = {
  id: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  status: string;
  totalBilled?: number | null;
  totalRated?: number | null;
  leakageAmount?: number | null;
  leakagePct?: number | null;
  completedAt?: string | null;
};

type DiscrepancyRecord = {
  id: string;
  account_id: string;
  discrepancy_type: string;
  expected_amount?: number | null;
  actual_amount?: number | null;
  delta?: number | null;
  resolution?: string | null;
};

type ReconciliationRecord = {
  id: string;
  period_start?: string | null;
  period_end?: string | null;
  status: string;
  gross_revenue?: number | null;
  adjustments?: number | null;
  net_revenue?: number | null;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string | null;
};

type ReportRecord = {
  id: string;
  report_type: string;
  period_start?: string | null;
  period_end?: string | null;
  generated_at?: string | null;
};

type SettlementRecord = {
  id: string;
  partner_id: string;
  partner_type: string;
  period_start?: string | null;
  period_end?: string | null;
  direction: string;
  gross_amount?: number | null;
  tax_amount?: number | null;
  net_amount?: number | null;
  currency?: string | null;
  status: string;
  due_date?: string | null;
  paid_at?: string | null;
};

type SlaRecord = {
  id: string;
  name: string;
  metric_type: string;
  target_value?: number | null;
  measurement_window?: string | null;
  penalty_json?: unknown;
  created_at?: string | null;
};

type SlaViolationRecord = {
  id: string;
  entity_type: string;
  entity_id: string;
  actual_value?: number | null;
  target_value?: number | null;
  period_start?: string | null;
  period_end?: string | null;
  penalty_applied?: number | null;
};

function getFirstError(...errors: unknown[]) {
  return errors.find(Boolean);
}

export function LiveCustomerDetailPage({ id }: { id: string }) {
  const customerQuery = useLiveRestResource<CustomerRecord>({
    endpoint: `/api/customers/${id}`,
    queryKey: ["customers", id],
    subscriptions: [
      { channelName: `customer-${id}`, queryKeys: [["customers", id]], table: "customers" }
    ]
  });
  const accountsQuery = useLiveRestCollection<AccountRecord>({
    endpoint: `/api/customers/${id}/accounts`,
    queryKey: ["customers", id, "accounts"],
    subscriptions: [
      { channelName: `customer-${id}-accounts`, queryKeys: [["customers", id, "accounts"]], table: "accounts" }
    ]
  });
  const ordersQuery = useLiveRestCollection<CustomerOrderRecord>({
    endpoint: `/api/customers/${id}/orders`,
    queryKey: ["customers", id, "orders"],
    subscriptions: [
      { channelName: `customer-${id}-orders`, queryKeys: [["customers", id, "orders"]], table: "orders" }
    ]
  });
  const servicesQuery = useLiveRestCollection<ServiceRecord>({
    endpoint: `/api/customers/${id}/services`,
    queryKey: ["customers", id, "services"],
    subscriptions: [
      { channelName: `customer-${id}-services`, queryKeys: [["customers", id, "services"]], table: "service_instances" }
    ]
  });

  if (customerQuery.isLoading || accountsQuery.isLoading || ordersQuery.isLoading || servicesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Customer / Profile"
        title="Customer profile"
        description="Unified customer profile with account, billing, order, and service context."
        message="Loading the customer record and linked account, order, and service data."
      />
    );
  }

  const error = getFirstError(customerQuery.error, accountsQuery.error, ordersQuery.error, servicesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Customer / Profile"
        title="Customer profile"
        description="Unified customer profile with account, billing, order, and service context."
        message={getQueryErrorMessage(error, "Unable to load this customer profile.")}
      />
    );
  }

  const customer = customerQuery.data;
  if (!customer) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Customer / Profile"
        title="Customer profile"
        description="Unified customer profile with account, billing, order, and service context."
        message="No customer was found for this tenant and route."
      />
    );
  }

  const accounts = accountsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="BSS / Customer / Profile"
      title={`${customer.firstName} ${customer.lastName}`}
      description="Unified customer profile with account, billing, order, and service context."
      stats={[
        { label: "Customer ID", value: customer.id },
        { label: "Status", value: customer.status },
        { label: "Accounts", value: String(accounts.length) },
        { label: "Orders", value: String(orders.length) }
      ]}
    >
      <CustomerCard
        name={`${customer.firstName} ${customer.lastName}`}
        subtitle={`Account ${customer.accountNumber} • ${accounts.length} linked account${accounts.length === 1 ? "" : "s"} • ${services.length} service instance${services.length === 1 ? "" : "s"}`}
        status={customer.status}
      />
      <SectionCard title="Profile" description="Tenant-scoped subscriber details for the current customer.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Account number", customer.accountNumber],
            ["Email", customer.email],
            ["Phone", formatValue(customer.phone)],
            ["Status", <StatusPill key="customer-status" label={customer.status} tone={getStatusTone(customer.status)} />],
            ["Created", formatDateTime(customer.createdAt)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Accounts" description="Linked billing accounts.">
        <DataTable
          columns={["Account ID", "Type", "Balance", "Status"]}
          rows={accounts.map((account) => [
            account.id,
            account.account_type,
            formatMoney(account.balance, account.currency ?? "USD"),
            <StatusPill key={account.id} label={account.status} tone={getStatusTone(account.status)} />
          ])}
          emptyMessage="No accounts linked to this customer yet."
        />
      </SectionCard>
      <SectionCard title="Recent orders" description="Latest product orders for this customer.">
        <DataTable
          columns={["Order", "Type", "Status", "Created"]}
          rows={orders.map((order) => [
            <Link className="font-semibold hover:underline" href={`/orders/${order.id}`} key={order.id}>
              {order.order_number ?? order.id}
            </Link>,
            order.order_type,
            <StatusPill key={`${order.id}-status`} label={order.status} tone={getStatusTone(order.status)} />,
            formatDateTime(order.created_at)
          ])}
          emptyMessage="No orders linked to this customer yet."
        />
      </SectionCard>
      <SectionCard title="Services" description="Provisioned service instances and their current activation state.">
        <DataTable
          columns={["Service", "Status", "Product", "Activated"]}
          rows={services.map((service) => [
            service.id,
            <StatusPill key={`${service.id}-status`} label={service.status} tone={getStatusTone(service.status)} />,
            formatValue(service.product_id),
            formatDateTime(service.activated_at)
          ])}
          emptyMessage="No service instances linked to this customer yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveCustomerAccountsPage({ id }: { id: string }) {
  const customerQuery = useLiveRestResource<CustomerRecord>({
    endpoint: `/api/customers/${id}`,
    queryKey: ["customers", id],
    subscriptions: [
      { channelName: `customer-${id}-accounts-page`, queryKeys: [["customers", id]], table: "customers" }
    ]
  });
  const accountsQuery = useLiveRestCollection<AccountRecord>({
    endpoint: `/api/customers/${id}/accounts`,
    queryKey: ["customers", id, "accounts"],
    subscriptions: [
      { channelName: `customer-${id}-accounts-page-data`, queryKeys: [["customers", id, "accounts"]], table: "accounts" }
    ]
  });

  if (customerQuery.isLoading || accountsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Customer / Accounts"
        title="Customer accounts"
        description="Billing accounts, balances, and credit posture for the selected customer."
        message="Loading the customer and linked account balances."
      />
    );
  }

  const error = getFirstError(customerQuery.error, accountsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Customer / Accounts"
        title="Customer accounts"
        description="Billing accounts, balances, and credit posture for the selected customer."
        message={getQueryErrorMessage(error, "Unable to load customer accounts.")}
      />
    );
  }

  const customer = customerQuery.data;
  if (!customer) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Customer / Accounts"
        title="Customer accounts"
        description="Billing accounts, balances, and credit posture for the selected customer."
        message="No customer was found for this tenant and route."
      />
    );
  }

  const accounts = accountsQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="BSS / Customer / Accounts"
      title={`${customer.firstName} ${customer.lastName}`}
      description="Billing accounts, balances, and credit posture for the selected customer."
      stats={[
        { label: "Customer", value: customer.accountNumber },
        { label: "Accounts", value: String(accounts.length) },
        { label: "Open balance", value: formatMoney(accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0)) }
      ]}
    >
      <SectionCard title="Account ledger" description="Tenant-scoped accounts linked to this customer.">
        <DataTable
          columns={["Account", "Type", "Credit limit", "Balance", "Status"]}
          rows={accounts.map((account) => [
            account.id,
            account.account_type,
            formatMoney(account.credit_limit, account.currency ?? "USD"),
            formatMoney(account.balance, account.currency ?? "USD"),
            <StatusPill key={`${account.id}-status`} label={account.status} tone={getStatusTone(account.status)} />
          ])}
          emptyMessage="No accounts are linked to this customer yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveCustomerOrdersPage({ id }: { id: string }) {
  const customerQuery = useLiveRestResource<CustomerRecord>({
    endpoint: `/api/customers/${id}`,
    queryKey: ["customers", id],
    subscriptions: [
      { channelName: `customer-${id}-orders-page`, queryKeys: [["customers", id]], table: "customers" }
    ]
  });
  const ordersQuery = useLiveRestCollection<CustomerOrderRecord>({
    endpoint: `/api/customers/${id}/orders`,
    queryKey: ["customers", id, "orders"],
    subscriptions: [
      { channelName: `customer-${id}-orders-page-data`, queryKeys: [["customers", id, "orders"]], table: "orders" }
    ]
  });

  if (customerQuery.isLoading || ordersQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Customer / Orders"
        title="Customer orders"
        description="Commercial orders and fulfilment outcomes for the selected customer."
        message="Loading the customer and linked order history."
      />
    );
  }

  const error = getFirstError(customerQuery.error, ordersQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Customer / Orders"
        title="Customer orders"
        description="Commercial orders and fulfilment outcomes for the selected customer."
        message={getQueryErrorMessage(error, "Unable to load customer orders.")}
      />
    );
  }

  const customer = customerQuery.data;
  if (!customer) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Customer / Orders"
        title="Customer orders"
        description="Commercial orders and fulfilment outcomes for the selected customer."
        message="No customer was found for this tenant and route."
      />
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="BSS / Customer / Orders"
      title={`${customer.firstName} ${customer.lastName}`}
      description="Commercial orders and fulfilment outcomes for the selected customer."
      stats={[
        { label: "Customer", value: customer.accountNumber },
        { label: "Orders", value: String(orders.length) },
        { label: "Open", value: String(orders.filter((order) => order.status !== "completed").length) }
      ]}
    >
      <SectionCard title="Order history" description="Latest order actions captured for this customer.">
        <DataTable
          columns={["Order", "Type", "Total", "Status", "Created", "Completed"]}
          rows={orders.map((order) => [
            <Link className="font-semibold hover:underline" href={`/orders/${order.id}`} key={order.id}>
              {order.order_number ?? order.id}
            </Link>,
            order.order_type,
            formatMoney(order.total_amount, order.currency ?? "USD"),
            <StatusPill key={`${order.id}-status`} label={order.status} tone={getStatusTone(order.status)} />,
            formatDateTime(order.created_at),
            formatDateTime(order.fulfilled_at)
          ])}
          emptyMessage="No orders are linked to this customer yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveCustomerInvoicesPage({ id }: { id: string }) {
  const customerQuery = useLiveRestResource<CustomerRecord>({
    endpoint: `/api/customers/${id}`,
    queryKey: ["customers", id],
    subscriptions: [
      { channelName: `customer-${id}-invoices-page`, queryKeys: [["customers", id]], table: "customers" }
    ]
  });
  const accountsQuery = useLiveRestCollection<AccountRecord>({
    endpoint: `/api/customers/${id}/accounts`,
    queryKey: ["customers", id, "accounts"],
    subscriptions: [
      { channelName: `customer-${id}-invoice-accounts`, queryKeys: [["customers", id, "accounts"]], table: "accounts" }
    ]
  });
  const invoicesQuery = useLiveRestCollection<PaymentRecord & {
    id: string;
    account_id?: string;
    invoice_number?: string;
    total?: number | null;
    currency?: string | null;
    status: string;
    due_date?: string | null;
    paid_at?: string | null;
  }>({
    endpoint: "/api/billing/invoices",
    queryKey: ["billing", "invoices", "customer", id],
    subscriptions: [
      { channelName: `customer-${id}-invoice-list`, queryKeys: [["billing", "invoices", "customer", id]], table: "invoices" },
      { channelName: `customer-${id}-payments`, queryKeys: [["billing", "invoices", "customer", id]], table: "payments" }
    ]
  });

  if (customerQuery.isLoading || accountsQuery.isLoading || invoicesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Customer / Invoices"
        title="Customer invoices"
        description="Billing documents issued against the customer’s linked accounts."
        message="Loading the customer, linked accounts, and invoice history."
      />
    );
  }

  const error = getFirstError(customerQuery.error, accountsQuery.error, invoicesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Customer / Invoices"
        title="Customer invoices"
        description="Billing documents issued against the customer’s linked accounts."
        message={getQueryErrorMessage(error, "Unable to load customer invoices.")}
      />
    );
  }

  const customer = customerQuery.data;
  if (!customer) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Customer / Invoices"
        title="Customer invoices"
        description="Billing documents issued against the customer’s linked accounts."
        message="No customer was found for this tenant and route."
      />
    );
  }

  const accountIds = new Set((accountsQuery.data ?? []).map((account) => account.id));
  const invoices = (invoicesQuery.data ?? []).filter((invoice) => accountIds.has(invoice.account_id ?? ""));

  return (
    <ModulePage
      eyebrow="BSS / Customer / Invoices"
      title={`${customer.firstName} ${customer.lastName}`}
      description="Billing documents issued against the customer’s linked accounts."
      stats={[
        { label: "Customer", value: customer.accountNumber },
        { label: "Accounts", value: String(accountIds.size) },
        { label: "Invoices", value: String(invoices.length) }
      ]}
    >
      <SectionCard title="Invoice history" description="Recent invoices billed to the customer’s accounts.">
        <DataTable
          columns={["Invoice", "Account", "Total", "Status", "Due", "Paid"]}
          rows={invoices.map((invoice) => [
            <Link className="font-semibold hover:underline" href={`/billing/invoices/${invoice.id}`} key={invoice.id}>
              invoice.invoice_number ?? invoice.id
            </Link>,
            invoice.account_id ?? "—",
            formatMoney(invoice.total, invoice.currency ?? "USD"),
            <StatusPill key={`${invoice.id}-status`} label={invoice.status} tone={getStatusTone(invoice.status)} />,
            formatDateTime(invoice.due_date),
            formatDateTime(invoice.paid_at)
          ])}
          emptyMessage="No invoices are linked to this customer yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveCustomerServicesPage({ id }: { id: string }) {
  const customerQuery = useLiveRestResource<CustomerRecord>({
    endpoint: `/api/customers/${id}`,
    queryKey: ["customers", id],
    subscriptions: [
      { channelName: `customer-${id}-services-page`, queryKeys: [["customers", id]], table: "customers" }
    ]
  });
  const servicesQuery = useLiveRestCollection<ServiceRecord>({
    endpoint: `/api/customers/${id}/services`,
    queryKey: ["customers", id, "services"],
    subscriptions: [
      { channelName: `customer-${id}-services-page-data`, queryKeys: [["customers", id, "services"]], table: "service_instances" }
    ]
  });

  if (customerQuery.isLoading || servicesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Customer / Services"
        title="Customer services"
        description="Provisioned service instances and network assignments tied to this customer."
        message="Loading the customer and linked service inventory."
      />
    );
  }

  const error = getFirstError(customerQuery.error, servicesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Customer / Services"
        title="Customer services"
        description="Provisioned service instances and network assignments tied to this customer."
        message={getQueryErrorMessage(error, "Unable to load customer services.")}
      />
    );
  }

  const customer = customerQuery.data;
  if (!customer) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Customer / Services"
        title="Customer services"
        description="Provisioned service instances and network assignments tied to this customer."
        message="No customer was found for this tenant and route."
      />
    );
  }

  const services = servicesQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="BSS / Customer / Services"
      title={`${customer.firstName} ${customer.lastName}`}
      description="Provisioned service instances and network assignments tied to this customer."
      stats={[
        { label: "Customer", value: customer.accountNumber },
        { label: "Services", value: String(services.length) },
        { label: "Active", value: String(services.filter((service) => service.status === "active").length) }
      ]}
    >
      <SectionCard title="Service inventory" description="Current and historical service instances for this customer.">
        <DataTable
          columns={["Service", "Product", "Element", "Status", "Activated", "Deactivated"]}
          rows={services.map((service) => [
            <Link className="font-semibold hover:underline" href={`/provisioning/${service.id}`} key={service.id}>
              {service.id}
            </Link>,
            formatValue(service.product_id),
            formatValue(service.network_element_id),
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

export function LiveProductDetailPage({ id }: { id: string }) {
  const productQuery = useLiveRestResource<ProductRecord>({
    endpoint: `/api/products/${id}`,
    queryKey: ["products", id],
    subscriptions: [
      { channelName: `product-${id}`, queryKeys: [["products", id]], table: "products" }
    ]
  });
  const promotionsQuery = useLiveRestCollection<PromotionRecord>({
    endpoint: `/api/products/${id}/promotions`,
    queryKey: ["products", id, "promotions"],
    subscriptions: [
      { channelName: `product-${id}-promotions`, queryKeys: [["products", id, "promotions"]], table: "promotions" }
    ]
  });
  const servicesQuery = useLiveRestCollection<ServiceRecord>({
    endpoint: "/api/services",
    queryKey: ["services", "product", id],
    subscriptions: [
      { channelName: `product-${id}-services`, queryKeys: [["services", "product", id]], table: "service_instances" }
    ]
  });

  if (productQuery.isLoading || promotionsQuery.isLoading || servicesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Catalog / Detail"
        title="Product detail"
        description="Catalog detail view for pricing, lifecycle, and linked service usage."
        message="Loading the product, linked promotions, and related service instances."
      />
    );
  }

  const error = getFirstError(productQuery.error, promotionsQuery.error, servicesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Catalog / Detail"
        title="Product detail"
        description="Catalog detail view for pricing, lifecycle, and linked service usage."
        message={getQueryErrorMessage(error, "Unable to load product detail.")}
      />
    );
  }

  const product = productQuery.data;
  if (!product) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Catalog / Detail"
        title="Product detail"
        description="Catalog detail view for pricing, lifecycle, and linked service usage."
        message="No product was found for this tenant and route."
      />
    );
  }

  const promotions = promotionsQuery.data ?? [];
  const services = (servicesQuery.data ?? []).filter((service) => service.product_id === id);

  return (
    <ModulePage
      eyebrow="BSS / Catalog / Detail"
      title={product.name}
      description={product.description ?? "Catalog detail view for pricing, lifecycle, and linked service usage."}
      stats={[
        { label: "Product ID", value: product.id },
        { label: "Lifecycle", value: product.lifecycleStatus ?? "unknown" },
        { label: "Billing cycle", value: product.billingCycle ?? "—" },
        { label: "Active services", value: String(services.length) }
      ]}
    >
      <SectionCard title="Product profile" description="Commercial and technical attributes for this product offering.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Category", formatValue(product.category)],
            ["Price", formatMoney(product.price, product.currency ?? "USD")],
            ["Version", formatValue(product.version)],
            ["Lifecycle", <StatusPill key="product-lifecycle" label={product.lifecycleStatus ?? "unknown"} tone={getStatusTone(product.lifecycleStatus)} />],
            ["Valid from", formatDateTime(product.validFrom)],
            ["Valid to", formatDateTime(product.validTo)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Promotions" description="Price adjustments and campaign offers linked to this product.">
        <DataTable
          columns={["Promotion", "Type", "Value", "Valid to"]}
          rows={promotions.map((promotion) => [
            promotion.name,
            promotion.discount_type,
            formatValue(promotion.discount_value),
            formatDateTime(promotion.valid_to)
          ])}
          emptyMessage="No promotions linked to this product yet."
        />
      </SectionCard>
      <SectionCard title="Linked services" description="Service instances currently provisioned from this product.">
        <DataTable
          columns={["Service", "Status", "Activated"]}
          rows={services.map((service) => [
            service.id,
            <StatusPill key={service.id} label={service.status} tone={getStatusTone(service.status)} />,
            formatDateTime(service.activated_at)
          ])}
          emptyMessage="No service instances are using this product yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveOrderDetailPage({ id }: { id: string }) {
  const orderQuery = useLiveRestResource<OrderRecord>({
    endpoint: `/api/orders/${id}`,
    queryKey: ["orders", id],
    subscriptions: [
      { channelName: `order-${id}`, queryKeys: [["orders", id]], table: "orders" }
    ]
  });
  const workOrdersQuery = useLiveRestCollection<WorkOrderRecord>({
    endpoint: `/api/orders/${id}/work-orders`,
    queryKey: ["orders", id, "work-orders"],
    subscriptions: [
      { channelName: `order-${id}-work-orders`, queryKeys: [["orders", id, "work-orders"]], table: "work_orders" }
    ]
  });

  if (orderQuery.isLoading || workOrdersQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Orders / Detail"
        title="Order detail"
        description="Track fulfilment, work orders, workflow state, and completion milestones for the selected order."
        message="Loading the order and linked fulfilment tasks."
      />
    );
  }

  const error = getFirstError(orderQuery.error, workOrdersQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Orders / Detail"
        title="Order detail"
        description="Track fulfilment, work orders, workflow state, and completion milestones for the selected order."
        message={getQueryErrorMessage(error, "Unable to load order detail.")}
      />
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Orders / Detail"
        title="Order detail"
        description="Track fulfilment, work orders, workflow state, and completion milestones for the selected order."
        message="No order was found for this tenant and route."
      />
    );
  }

  const workOrders = workOrdersQuery.data ?? [];
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <ModulePage
      eyebrow="BSS / Orders / Detail"
      title={order.orderNumber}
      description="Track fulfilment, work orders, workflow state, and completion milestones for the selected order."
      stats={[
        { label: "Order ID", value: order.id },
        { label: "Status", value: order.status },
        { label: "Type", value: order.orderType },
        { label: "Work orders", value: String(workOrders.length) }
      ]}
    >
      <OrderTimeline
        steps={[
          `Order requested on ${formatDateTime(order.requestedStartDate)}`,
          `Current status: ${order.status}`,
          order.completionDate ? `Completed on ${formatDateTime(order.completionDate)}` : "Awaiting fulfilment completion"
        ]}
      />
      <SectionCard title="Order summary" description="Commercial order details from the current order record.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Customer ID", order.customerId],
            ["Account ID", formatValue(order.accountId)],
            ["Type", order.orderType],
            ["Total", formatMoney(order.totalAmount, order.currency ?? "USD")],
            ["Requested", formatDateTime(order.requestedStartDate)],
            ["Completed", formatDateTime(order.completionDate)],
            ["Status", <StatusPill key="order-status" label={order.status} tone={getStatusTone(order.status)} />]
          ]}
        />
      </SectionCard>
      <SectionCard title="Order items" description="Payload items captured at order creation.">
        <DataTable
          columns={["Product", "Quantity", "Note"]}
          rows={items.map((item, index) => [
            formatValue(item.productId),
            formatValue(item.quantity),
            formatValue(item.note ?? `Item ${index + 1}`)
          ])}
          emptyMessage="No structured items were recorded for this order."
        />
      </SectionCard>
      <SectionCard title="Work orders" description="Operational work order tasks linked to fulfilment.">
        <DataTable
          columns={["Type", "Status", "Due", "Assigned"]}
          rows={workOrders.map((workOrder) => [
            workOrder.type,
            <StatusPill key={workOrder.id} label={workOrder.status} tone={getStatusTone(workOrder.status)} />,
            formatValue(workOrder.due_date),
            formatValue(workOrder.assigned_to)
          ])}
          emptyMessage="No work orders are linked to this order yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveBillingInvoiceDetailPage({ id }: { id: string }) {
  const invoiceQuery = useLiveRestResource<InvoiceRecord>({
    endpoint: `/api/billing/invoices/${id}`,
    queryKey: ["billing", "invoices", id],
    subscriptions: [
      { channelName: `invoice-${id}`, queryKeys: [["billing", "invoices", id]], table: "invoices" },
      { channelName: `invoice-${id}-payments`, queryKeys: [["billing", "invoices", id]], table: "payments" }
    ]
  });
  const paymentsQuery = useLiveRestCollection<PaymentRecord>({
    endpoint: "/api/billing/payments",
    queryKey: ["billing", "payments", id],
    subscriptions: [
      { channelName: `invoice-${id}-payment-list`, queryKeys: [["billing", "payments", id]], table: "payments" }
    ]
  });

  if (invoiceQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Billing / Invoice Detail"
        title="Invoice detail"
        description="Inspect a single bill, tax items, payment status, and customer-facing invoice rendering data."
        message="Loading the invoice and linked payment activity."
      />
    );
  }

  const error = getFirstError(invoiceQuery.error, paymentsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Billing / Invoice Detail"
        title="Invoice detail"
        description="Inspect a single bill, tax items, payment status, and customer-facing invoice rendering data."
        message={getQueryErrorMessage(error, "Unable to load invoice detail.")}
      />
    );
  }

  const invoice = invoiceQuery.data;
  if (!invoice) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Billing / Invoice Detail"
        title="Invoice detail"
        description="Inspect a single bill, tax items, payment status, and customer-facing invoice rendering data."
        message="No invoice was found for this tenant and route."
      />
    );
  }

  const payments = (paymentsQuery.data ?? []).filter((payment) => payment.invoice_id === id);
  const collectedAmount = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const outstandingAmount = Math.max(Number(invoice.total ?? 0) - collectedAmount, 0);

  return (
    <ModulePage
      eyebrow="BSS / Billing / Invoice Detail"
      title={invoice.invoiceNumber}
      description="Inspect a single bill, tax items, payment status, and customer-facing invoice rendering data."
      stats={[
        { label: "Invoice", value: invoice.id },
        { label: "Status", value: invoice.status },
        { label: "Total", value: formatMoney(invoice.total, "USD") },
        { label: "Payments", value: String(payments.length) }
      ]}
    >
      <InvoiceTable
        stats={[
          { label: "Status", value: invoice.status, tone: invoice.status === "paid" ? "accent" : "warning" },
          { label: "Collected", value: formatMoney(collectedAmount, "USD") },
          { label: "Outstanding", value: formatMoney(outstandingAmount, "USD"), tone: outstandingAmount > 0 ? "warning" : "default" },
          { label: "Payments", value: String(payments.length) }
        ]}
      />
      <SectionCard title="Invoice summary" description="Billing period, totals, and settlement state for this customer bill.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Account ID", invoice.accountId],
            ["Billing start", formatDateTime(invoice.billingPeriod?.startDateTime)],
            ["Billing end", formatDateTime(invoice.billingPeriod?.endDateTime)],
            ["Subtotal", formatMoney(invoice.subtotal, "USD")],
            ["Tax", formatMoney(invoice.tax, "USD")],
            ["Total", formatMoney(invoice.total, "USD")],
            ["Due date", formatDateTime(invoice.dueDate)],
            ["Paid at", formatDateTime(invoice.paidAt)],
            ["Status", <StatusPill key="invoice-status" label={invoice.status} tone={getStatusTone(invoice.status)} />]
          ]}
        />
      </SectionCard>
      <SectionCard title="Payments" description="Payment attempts or successful collections linked to this invoice.">
        <DataTable
          columns={["Amount", "Method", "Status", "Paid at"]}
          rows={payments.map((payment) => [
            formatMoney(payment.amount, payment.currency ?? "USD"),
            payment.method ?? "—",
            <StatusPill key={payment.id} label={payment.status} tone={getStatusTone(payment.status)} />,
            formatDateTime(payment.paid_at)
          ])}
          emptyMessage="No payments are linked to this invoice yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveRevenueAssuranceDetailPage({ jobId }: { jobId: string }) {
  const jobQuery = useLiveRestResource<RevenueJobRecord>({
    endpoint: `/api/revenue/assurance/${jobId}`,
    queryKey: ["revenue", "assurance", jobId],
    subscriptions: [
      { channelName: `revenue-assurance-${jobId}`, queryKeys: [["revenue", "assurance", jobId]], table: "revenue_assurance_jobs" }
    ]
  });
  const discrepanciesQuery = useLiveRestCollection<DiscrepancyRecord>({
    endpoint: `/api/revenue/assurance/${jobId}/discrepancies`,
    queryKey: ["revenue", "assurance", jobId, "discrepancies"],
    subscriptions: [
      { channelName: `revenue-discrepancies-${jobId}`, queryKeys: [["revenue", "assurance", jobId, "discrepancies"]], table: "revenue_discrepancies" }
    ]
  });

  if (jobQuery.isLoading || discrepanciesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Revenue / Assurance Detail"
        title="Revenue assurance detail"
        description="Detailed leakage output for the selected revenue assurance job."
        message="Loading the assurance job and discrepancy set."
      />
    );
  }

  const error = getFirstError(jobQuery.error, discrepanciesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Revenue / Assurance Detail"
        title="Revenue assurance detail"
        description="Detailed leakage output for the selected revenue assurance job."
        message={getQueryErrorMessage(error, "Unable to load revenue assurance detail.")}
      />
    );
  }

  const job = jobQuery.data;
  if (!job) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Revenue / Assurance Detail"
        title="Revenue assurance detail"
        description="Detailed leakage output for the selected revenue assurance job."
        message="No assurance job was found for this tenant and route."
      />
    );
  }

  const discrepancies = discrepanciesQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="BSS / Revenue / Assurance Detail"
      title={job.id}
      description="Detailed leakage output for the selected revenue assurance job."
      stats={[
        { label: "Status", value: job.status },
        { label: "Leakage", value: formatPercent(job.leakagePct, 4) },
        { label: "Discrepancies", value: String(discrepancies.length) }
      ]}
    >
      <RevenueAssurancePanel
        stats={[
          { label: "Status", value: job.status, tone: job.status === "completed" ? "accent" : "warning" },
          { label: "Leakage", value: formatPercent(job.leakagePct, 4), tone: Number(job.leakagePct ?? 0) > 0 ? "warning" : "default" },
          { label: "Discrepancies", value: String(discrepancies.length), tone: discrepancies.length > 0 ? "warning" : "default" },
          { label: "Rated total", value: formatMoney(job.totalRated) }
        ]}
      />
      <SectionCard title="Job summary" description="High-level assurance job metrics for the selected period.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Period start", formatDateTime(job.periodStart)],
            ["Period end", formatDateTime(job.periodEnd)],
            ["Status", <StatusPill key="job-status" label={job.status} tone={getStatusTone(job.status)} />],
            ["Rated total", formatMoney(job.totalRated)],
            ["Billed total", formatMoney(job.totalBilled)],
            ["Leakage amount", formatMoney(job.leakageAmount)],
            ["Leakage pct", formatPercent(job.leakagePct, 4)],
            ["Completed at", formatDateTime(job.completedAt)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Discrepancies" description="Account-level mismatches detected during the assurance run.">
        <DataTable
          columns={["Account", "Type", "Expected", "Actual", "Delta", "Resolution"]}
          rows={discrepancies.map((discrepancy) => [
            discrepancy.account_id,
            discrepancy.discrepancy_type,
            formatMoney(discrepancy.expected_amount),
            formatMoney(discrepancy.actual_amount),
            formatMoney(discrepancy.delta),
            discrepancy.resolution ?? "open"
          ])}
          emptyMessage="No discrepancies were recorded for this job."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveRevenueReconciliationDetailPage({ runId }: { runId: string }) {
  const runQuery = useLiveRestResource<ReconciliationRecord>({
    endpoint: `/api/revenue/reconciliation/${runId}`,
    queryKey: ["revenue", "reconciliation", runId],
    subscriptions: [
      { channelName: `reconciliation-${runId}`, queryKeys: [["revenue", "reconciliation", runId]], table: "reconciliation_runs" }
    ]
  });
  const reportsQuery = useLiveRestCollection<ReportRecord>({
    endpoint: "/api/revenue/reports",
    queryKey: ["revenue", "reports", runId],
    subscriptions: [
      { channelName: `reconciliation-${runId}-reports`, queryKeys: [["revenue", "reports", runId]], table: "financial_reports" }
    ]
  });

  if (runQuery.isLoading || reportsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Revenue / Reconciliation Detail"
        title="Reconciliation detail"
        description="Net revenue review, approvals, and supporting report references for the selected run."
        message="Loading the reconciliation run and supporting financial reports."
      />
    );
  }

  const error = getFirstError(runQuery.error, reportsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Revenue / Reconciliation Detail"
        title="Reconciliation detail"
        description="Net revenue review, approvals, and supporting report references for the selected run."
        message={getQueryErrorMessage(error, "Unable to load reconciliation detail.")}
      />
    );
  }

  const run = runQuery.data;
  if (!run) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Revenue / Reconciliation Detail"
        title="Reconciliation detail"
        description="Net revenue review, approvals, and supporting report references for the selected run."
        message="No reconciliation run was found for this tenant and route."
      />
    );
  }

  const reports = reportsQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="BSS / Revenue / Reconciliation Detail"
      title={run.id}
      description="Net revenue review, approvals, and supporting report references for the selected run."
      stats={[
        { label: "Status", value: run.status },
        { label: "Net revenue", value: formatMoney(run.net_revenue) },
        { label: "Support reports", value: String(reports.length) }
      ]}
    >
      <ReconciliationTable
        stats={[
          { label: "Status", value: run.status, tone: run.status === "approved" ? "accent" : "warning" },
          { label: "Gross", value: formatMoney(run.gross_revenue) },
          { label: "Adjustments", value: formatMoney(run.adjustments) },
          { label: "Net", value: formatMoney(run.net_revenue) }
        ]}
      />
      <SectionCard title="Run summary" description="Financial close metrics recorded against this reconciliation run.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Period start", formatDateTime(run.period_start)],
            ["Period end", formatDateTime(run.period_end)],
            ["Status", <StatusPill key="run-status" label={run.status} tone={getStatusTone(run.status)} />],
            ["Gross revenue", formatMoney(run.gross_revenue)],
            ["Adjustments", formatMoney(run.adjustments)],
            ["Net revenue", formatMoney(run.net_revenue)],
            ["Approved by", formatValue(run.approved_by)],
            ["Approved at", formatDateTime(run.approved_at)],
            ["Notes", formatValue(run.notes)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Supporting reports" description="Recent finance reports available for reconciliation review.">
        <DataTable
          columns={["Report", "Period", "Generated"]}
          rows={reports.map((report) => [
            report.report_type,
            `${formatDateTime(report.period_start)} to ${formatDateTime(report.period_end)}`,
            formatDateTime(report.generated_at)
          ])}
          emptyMessage="No supporting reports exist for this tenant yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveRevenueSettlementDetailPage({ id }: { id: string }) {
  const statementQuery = useLiveRestResource<SettlementRecord>({
    endpoint: `/api/revenue/settlement/${id}`,
    queryKey: ["revenue", "settlement", id],
    subscriptions: [
      { channelName: `settlement-${id}`, queryKeys: [["revenue", "settlement", id]], table: "settlement_statements" }
    ]
  });

  if (statementQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / Revenue / Settlement Detail"
        title="Settlement detail"
        description="Partner settlement summary for the selected payable or receivable statement."
        message="Loading the settlement statement."
      />
    );
  }

  if (statementQuery.error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / Revenue / Settlement Detail"
        title="Settlement detail"
        description="Partner settlement summary for the selected payable or receivable statement."
        message={getQueryErrorMessage(statementQuery.error, "Unable to load settlement detail.")}
      />
    );
  }

  const statement = statementQuery.data;
  if (!statement) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / Revenue / Settlement Detail"
        title="Settlement detail"
        description="Partner settlement summary for the selected payable or receivable statement."
        message="No settlement statement was found for this tenant and route."
      />
    );
  }

  return (
    <ModulePage
      eyebrow="BSS / Revenue / Settlement Detail"
      title={statement.id}
      description="Partner settlement summary for the selected payable or receivable statement."
      stats={[
        { label: "Status", value: statement.status },
        { label: "Direction", value: statement.direction },
        { label: "Net amount", value: formatMoney(statement.net_amount, statement.currency ?? "USD") }
      ]}
    >
      <SettlementCard
        amount={formatMoney(statement.net_amount, statement.currency ?? "USD")}
        direction={statement.direction}
        partner={`${statement.partner_type} / ${statement.partner_id}`}
        status={statement.status}
      />
      <SectionCard title="Statement summary" description="Settlement period and payable or receivable totals.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Partner", `${statement.partner_type} / ${statement.partner_id}`],
            ["Period start", formatDateTime(statement.period_start)],
            ["Period end", formatDateTime(statement.period_end)],
            ["Direction", statement.direction],
            ["Gross amount", formatMoney(statement.gross_amount, statement.currency ?? "USD")],
            ["Tax amount", formatMoney(statement.tax_amount, statement.currency ?? "USD")],
            ["Net amount", formatMoney(statement.net_amount, statement.currency ?? "USD")],
            ["Status", <StatusPill key="settlement-status" label={statement.status} tone={getStatusTone(statement.status)} />],
            ["Due date", formatDateTime(statement.due_date)],
            ["Paid at", formatDateTime(statement.paid_at)]
          ]}
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveSlaDetailPage({ id }: { id: string }) {
  const slaQuery = useLiveRestResource<SlaRecord>({
    endpoint: `/api/sla/${id}`,
    queryKey: ["sla", id],
    subscriptions: [
      { channelName: `sla-${id}`, queryKeys: [["sla", id]], table: "slas" }
    ]
  });
  const violationsQuery = useLiveRestCollection<SlaViolationRecord>({
    endpoint: `/api/sla/${id}/violations`,
    queryKey: ["sla", id, "violations"],
    subscriptions: [
      { channelName: `sla-${id}-violations`, queryKeys: [["sla", id, "violations"]], table: "sla_violations" }
    ]
  });

  if (slaQuery.isLoading || violationsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="BSS / SLA / Detail"
        title="SLA detail"
        description="Violation history and objective detail for the selected service-level agreement."
        message="Loading the SLA objective and violation history."
      />
    );
  }

  const error = getFirstError(slaQuery.error, violationsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="BSS / SLA / Detail"
        title="SLA detail"
        description="Violation history and objective detail for the selected service-level agreement."
        message={getQueryErrorMessage(error, "Unable to load SLA detail.")}
      />
    );
  }

  const sla = slaQuery.data;
  if (!sla) {
    return (
      <NotFoundModulePage
        eyebrow="BSS / SLA / Detail"
        title="SLA detail"
        description="Violation history and objective detail for the selected service-level agreement."
        message="No SLA was found for this tenant and route."
      />
    );
  }

  const violations = violationsQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="BSS / SLA / Detail"
      title={sla.name}
      description="Violation history and objective detail for the selected service-level agreement."
      stats={[
        { label: "Metric", value: sla.metric_type },
        { label: "Target", value: String(sla.target_value ?? "—") },
        { label: "Violations", value: String(violations.length) }
      ]}
    >
      <SlaStatus
        detail={`${violations.length} recorded violation${violations.length === 1 ? "" : "s"} in the current tenant scope.`}
        headline={sla.name}
        status={violations.length === 0 ? "on target" : "breached"}
      />
      <SectionCard title="SLA summary" description="Configured target and penalty metadata.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Metric type", sla.metric_type],
            ["Target value", String(sla.target_value ?? "—")],
            ["Measurement window", sla.measurement_window ?? "—"],
            ["Penalty", formatValue(sla.penalty_json)],
            ["Created", formatDateTime(sla.created_at)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Violation log" description="Recorded breaches and applied penalties for this SLA.">
        <DataTable
          columns={["Entity", "Actual", "Target", "Period", "Penalty"]}
          rows={violations.map((violation) => [
            `${violation.entity_type} / ${violation.entity_id}`,
            String(violation.actual_value ?? "—"),
            String(violation.target_value ?? "—"),
            `${formatDateTime(violation.period_start)} to ${formatDateTime(violation.period_end)}`,
            formatMoney(violation.penalty_applied)
          ])}
          emptyMessage="No SLA violations have been recorded for this agreement yet."
        />
      </SectionCard>
    </ModulePage>
  );
}
