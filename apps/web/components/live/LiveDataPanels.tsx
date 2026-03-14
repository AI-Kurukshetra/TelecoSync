"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { KpiCard } from "@/components/charts/KpiCard";
import { ApiRegistryTable } from "@/components/integrations/ApiRegistryTable";
import { ConnectorCard } from "@/components/integrations/ConnectorCard";
import { DeliveryLog } from "@/components/integrations/DeliveryLog";
import { EventLogTable } from "@/components/integrations/EventLogTable";
import { SectionCard } from "@/components/ui/SectionCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatGrid } from "@/components/ui/StatGrid";
import { StatusPill } from "@/components/ui/StatusPill";
import { useBilling } from "@/lib/hooks/useBilling";
import { useCustomers } from "@/lib/hooks/useCustomers";
import {
  useAnalyticsSnapshot,
  useApiRegistry,
  useConnectors,
  useIntegrationEvents,
  useWebhooks
} from "@/lib/hooks/useIntegrations";
import { useLiveQueryInvalidation } from "@/lib/hooks/useLiveQueryInvalidation";
import { useOrders } from "@/lib/hooks/useOrders";
import { useProducts } from "@/lib/hooks/useProducts";
import { useRevenue } from "@/lib/hooks/useRevenue";
import { fetchJson } from "@/lib/hooks/fetcher";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

function formatMoney(value: number | null | undefined, currency = "USD") {
  return value === null || value === undefined ? "—" : formatCurrency(value, currency);
}

function formatDateTime(value: string | null | undefined) {
  return value ? formatDate(value) : "—";
}

function getStatusTone(status: string | null | undefined) {
  const normalized = (status ?? "").toLowerCase();

  if (["active", "paid", "sent", "completed", "resolved", "success", "enabled", "processed"].includes(normalized)) {
    return "success" as const;
  }

  if (["pending", "draft", "queued", "running", "warning", "retrying"].includes(normalized)) {
    return "warning" as const;
  }

  if (["failed", "inactive", "open", "critical", "disabled", "cancelled"].includes(normalized)) {
    return "danger" as const;
  }

  return "neutral" as const;
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <SectionCard title={title}>
      <p className="text-sm text-[var(--danger)]">{message}</p>
    </SectionCard>
  );
}

function LoadingState({ title, description }: { title: string; description: string }) {
  return (
    <SectionCard title={title} description={description}>
      <p className="text-sm text-[var(--muted)]">Loading live data...</p>
    </SectionCard>
  );
}

function useLiveRestCollection<T>({
  queryKey,
  endpoint,
  table,
  channelName
}: {
  queryKey: readonly string[];
  endpoint: string;
  table: string;
  channelName: string;
}) {
  useLiveQueryInvalidation({
    channelName,
    queryKeys: [queryKey],
    table
  });

  return useQuery({
    queryKey: [...queryKey],
    queryFn: () => fetchJson<T[]>(endpoint)
  });
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function LiveCustomersPanel() {
  const query = useCustomers();

  useLiveQueryInvalidation({
    channelName: "customers-live-panel",
    queryKeys: [["customers"]],
    table: "customers"
  });

  if (query.isLoading) {
    return <LoadingState title="Recent customers" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Recent customers" message={query.error.message} />;
  }

  const customers = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Live customers", value: String(customers.length), tone: "accent" },
          { label: "Active", value: String(customers.filter((customer) => customer.status === "active").length) },
          { label: "Suspended", value: String(customers.filter((customer) => customer.status !== "active").length) }
        ]}
      />
      <SectionCard title="Recent customers" description="Updated automatically as records change.">
        <DataTable
          columns={["Customer", "Account", "Email", "Status"]}
          rows={customers.map((customer) => [
            <Link href={(customer.href ?? `/customers/${customer.id}`) as Route} key={customer.id}>
              {customer.firstName} {customer.lastName}
            </Link>,
            customer.accountNumber,
            customer.email,
            <StatusPill key={`${customer.id}-status`} label={customer.status} tone={getStatusTone(customer.status)} />
          ])}
          emptyMessage="No customers exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveOrdersPanel() {
  const query = useOrders();

  useLiveQueryInvalidation({
    channelName: "orders-live-panel",
    queryKeys: [["orders"]],
    table: "orders"
  });

  if (query.isLoading) {
    return <LoadingState title="Order queue" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Order queue" message={query.error.message} />;
  }

  const orders = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Live orders", value: String(orders.length), tone: "accent" },
          { label: "Open", value: String(orders.filter((order) => order.status !== "completed").length), tone: "warning" },
          { label: "Completed", value: String(orders.filter((order) => order.status === "completed").length) }
        ]}
      />
      <SectionCard title="Order queue" description="Updated automatically as records change.">
        <DataTable
          columns={["Order", "Type", "Total", "Status", "Requested", "Completed"]}
          rows={orders.map((order) => [
            <Link href={`/orders/${order.id}` as Route} key={order.id}>
              {order.orderNumber}
            </Link>,
            order.orderType,
            formatMoney(order.totalAmount, order.currency ?? "USD"),
            <StatusPill key={`${order.id}-status`} label={order.status} tone={getStatusTone(order.status)} />,
            formatDateTime(order.requestedStartDate),
            formatDateTime(order.completionDate)
          ])}
          emptyMessage="No orders exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveInvoicesPanel() {
  const query = useBilling();

  useLiveQueryInvalidation({
    channelName: "invoices-live-panel",
    queryKeys: [["billing", "invoices"]],
    table: "invoices"
  });
  useLiveQueryInvalidation({
    channelName: "payments-live-panel",
    queryKeys: [["billing", "invoices"]],
    table: "payments"
  });

  if (query.isLoading) {
    return <LoadingState title="Invoice ledger" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Invoice ledger" message={query.error.message} />;
  }

  const invoices = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Live invoices", value: String(invoices.length), tone: "accent" },
          { label: "Open", value: String(invoices.filter((invoice) => !["paid", "cancelled"].includes(invoice.status)).length), tone: "warning" },
          { label: "Paid", value: String(invoices.filter((invoice) => invoice.status === "paid").length) }
        ]}
      />
      <SectionCard title="Invoice ledger" description="Updated automatically as records change.">
        <DataTable
          columns={["Invoice", "Account", "Total", "Status", "Due", "Paid"]}
          rows={invoices.map((invoice) => [
            <Link href={`/billing/invoices/${invoice.id}` as Route} key={invoice.id}>
              {invoice.invoiceNumber}
            </Link>,
            invoice.accountId,
            formatMoney(invoice.total),
            <StatusPill key={`${invoice.id}-status`} label={invoice.status} tone={getStatusTone(invoice.status)} />,
            formatDateTime(invoice.dueDate),
            formatDateTime(invoice.paidAt)
          ])}
          emptyMessage="No invoices exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveWebhooksPanel() {
  const query = useWebhooks();

  useLiveQueryInvalidation({
    channelName: "webhook-subscriptions-live-panel",
    queryKeys: [["integrations", "webhooks"]],
    table: "webhook_subscriptions"
  });
  useLiveQueryInvalidation({
    channelName: "webhook-deliveries-live-panel",
    queryKeys: [["integrations", "webhooks"]],
    table: "webhook_deliveries"
  });

  if (query.isLoading) {
    return <LoadingState title="Subscriptions" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Subscriptions" message={query.error.message} />;
  }

  const webhooks = query.data ?? [];

  return (
    <div className="space-y-6">
      <DeliveryLog
        description="Current webhook subscription posture for this workspace."
        stats={[
          { label: "Subscriptions", value: String(webhooks.length), tone: "accent" },
          { label: "Enabled", value: String(webhooks.filter((item) => item.enabled).length) },
          { label: "Disabled", value: String(webhooks.filter((item) => !item.enabled).length), tone: "warning" }
        ]}
      />
      <SectionCard title="Subscriptions" description="Updated automatically as records change.">
        <DataTable
          columns={["Webhook", "Target", "Events", "Enabled", "Created"]}
          rows={webhooks.map((webhook) => [
            <Link href={`/integrations/webhooks/${webhook.id}` as Route} key={webhook.id}>
              {webhook.name}
            </Link>,
            webhook.target_url,
            webhook.event_types.join(", "),
            <StatusPill
              key={`${webhook.id}-enabled`}
              label={webhook.enabled ? "enabled" : "disabled"}
              tone={getStatusTone(webhook.enabled ? "enabled" : "disabled")}
            />,
            formatDateTime(webhook.created_at ?? null)
          ])}
          emptyMessage="No webhook subscriptions exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveConnectorsPanel() {
  const query = useConnectors();

  useLiveQueryInvalidation({
    channelName: "integration-connectors-live-panel",
    queryKeys: [["integrations", "connectors"]],
    table: "integration_connectors"
  });
  useLiveQueryInvalidation({
    channelName: "connector-executions-live-panel",
    queryKeys: [["integrations", "connectors"]],
    table: "connector_executions"
  });

  if (query.isLoading) {
    return <LoadingState title="Configured connectors" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Configured connectors" message={query.error.message} />;
  }

  const connectors = query.data ?? [];

  return (
    <div className="space-y-6">
      <ConnectorCard
        stats={[
          { label: "Connectors", value: String(connectors.length), tone: "accent" },
          { label: "Enabled", value: String(connectors.filter((item) => item.enabled).length) },
          { label: "Failures", value: String(connectors.filter((item) => item.last_run_status === "failed").length), tone: "warning" },
          { label: "Systems", value: String(new Set(connectors.map((item) => item.system_type)).size) }
        ]}
      />
      <SectionCard title="Configured connectors" description="Updated automatically as records change.">
        <DataTable
          columns={["Connector", "Type", "Direction", "System", "Enabled", "Last run"]}
          rows={connectors.map((connector) => [
            <Link href={`/integrations/connectors/${connector.id}` as Route} key={connector.id}>
              {connector.name}
            </Link>,
            connector.connector_type,
            connector.direction,
            connector.system_type,
            <StatusPill
              key={`${connector.id}-enabled`}
              label={connector.enabled ? "enabled" : "disabled"}
              tone={getStatusTone(connector.enabled ? "enabled" : "disabled")}
            />,
            connector.last_run_status ?? formatDateTime(connector.last_run_at ?? null)
          ])}
          emptyMessage="No connectors exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveEventBusPanel() {
  const query = useIntegrationEvents();

  useLiveQueryInvalidation({
    channelName: "event-log-live-panel",
    queryKeys: [["integrations", "events"]],
    table: "event_log"
  });

  if (query.isLoading) {
    return <LoadingState title="Recent events" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Recent events" message={query.error.message} />;
  }

  const events = query.data ?? [];

  return (
    <div className="space-y-6">
      <EventLogTable
        stats={[
          { label: "Events", value: String(events.length), tone: "accent" },
          { label: "Processed", value: String(events.filter((event) => event.processed).length) },
          { label: "Pending", value: String(events.filter((event) => !event.processed).length), tone: "warning" },
          { label: "Sources", value: String(new Set(events.map((event) => event.source_service)).size) }
        ]}
      />
      <SectionCard title="Recent events" description="Updated automatically as records change.">
        <DataTable
          columns={["Event type", "Entity", "Source", "Processed", "Fired at"]}
          rows={events.map((event) => [
            event.event_type,
            `${event.entity_type} / ${event.entity_id}`,
            event.source_service,
            <StatusPill
              key={`${event.id}-processed`}
              label={event.processed ? "processed" : "pending"}
              tone={getStatusTone(event.processed ? "processed" : "pending")}
            />,
            formatDateTime(event.fired_at)
          ])}
          emptyMessage="No events exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveApiRegistryPanel() {
  const query = useApiRegistry();

  useLiveQueryInvalidation({
    channelName: "api-registry-live-panel",
    queryKeys: [["integrations", "registry"]],
    table: "api_registry"
  });

  if (query.isLoading) {
    return <LoadingState title="Registered APIs" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Registered APIs" message={query.error.message} />;
  }

  const apis = query.data ?? [];

  return (
    <div className="space-y-6">
      <ApiRegistryTable
        stats={[
          { label: "APIs", value: String(apis.length), tone: "accent" },
          { label: "Standards", value: String(apis.filter((api) => api.standard).length) },
          { label: "Custom", value: String(apis.filter((api) => !api.standard).length) },
          { label: "Active", value: String(apis.filter((api) => api.status === "active").length) }
        ]}
      />
      <SectionCard title="Registered APIs" description="Updated automatically as records change.">
        <DataTable
          columns={["API", "Standard", "Version", "Auth", "Status"]}
          rows={apis.map((api) => [
            <Link href={`/integrations/registry/${api.id}` as Route} key={api.id}>
              {api.name}
            </Link>,
            api.standard ?? "custom",
            api.version,
            api.auth_type,
            <StatusPill key={`${api.id}-status`} label={api.status} tone={getStatusTone(api.status)} />
          ])}
          emptyMessage="No API registry entries exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveProductsPanel() {
  const query = useProducts();

  useLiveQueryInvalidation({
    channelName: "products-live-panel",
    queryKeys: [["products"]],
    table: "products"
  });

  if (query.isLoading) {
    return <LoadingState title="Catalog entries" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Catalog entries" message={query.error.message} />;
  }

  const products = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Products", value: String(products.length), tone: "accent" },
          { label: "Active", value: String(products.filter((product) => product.lifecycleStatus === "Active").length) },
          { label: "Usage priced", value: String(products.filter((product) => product.billingCycle === "usage").length) }
        ]}
      />
      <SectionCard title="Catalog entries" description="Updated automatically as records change.">
        <DataTable
          columns={["Product", "Category", "Price", "Billing", "Status"]}
          rows={products.map((product) => [
            <Link href={`/products/${product.id}` as Route} key={product.id}>
              {product.name}
            </Link>,
            product.category ?? "—",
            formatMoney(product.price, product.currency ?? "USD"),
            product.billingCycle ?? "—",
            <StatusPill key={`${product.id}-status`} label={product.lifecycleStatus ?? "unknown"} tone={getStatusTone(product.lifecycleStatus)} />
          ])}
          emptyMessage="No products exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LivePaymentsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["billing", "payments"],
    endpoint: "/api/billing/payments",
    table: "payments",
    channelName: "billing-payments-live-panel"
  });

  if (query.isLoading) {
    return <LoadingState title="Collection activity" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Collection activity" message={query.error.message} />;
  }

  const payments = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Payments", value: String(payments.length), tone: "accent" },
          { label: "Paid", value: String(payments.filter((payment) => payment.status === "paid").length) },
          { label: "Pending", value: String(payments.filter((payment) => payment.status !== "paid").length), tone: "warning" }
        ]}
      />
      <SectionCard title="Collection activity" description="Updated automatically as records change.">
        <DataTable
          columns={["Invoice", "Amount", "Method", "Status", "Gateway ref", "Paid at"]}
          rows={payments.map((payment) => [
            formatValue(payment.invoice_id),
            formatMoney(Number(payment.amount ?? 0), String(payment.currency ?? "USD")),
            formatValue(payment.method),
            <StatusPill key={`${payment.id}-status`} label={String(payment.status ?? "pending")} tone={getStatusTone(String(payment.status ?? "pending"))} />,
            formatValue(payment.gateway_reference),
            formatDateTime(String(payment.paid_at ?? ""))
          ])}
          emptyMessage="No payments exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveBillingOverviewPanel() {
  const invoicesQuery = useBilling();
  const paymentsQuery = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["billing", "payments"],
    endpoint: "/api/billing/payments",
    table: "payments",
    channelName: "billing-overview-payments-live-panel"
  });
  const usageQuery = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["billing", "usage"],
    endpoint: "/api/billing/usage",
    table: "usage_records",
    channelName: "billing-usage-live-panel"
  });

  useLiveQueryInvalidation({
    channelName: "billing-overview-invoices-live-panel",
    queryKeys: [["billing", "invoices"]],
    table: "invoices"
  });

  if (invoicesQuery.isLoading || paymentsQuery.isLoading || usageQuery.isLoading) {
    return <LoadingState title="Billing operations" description="Billing APIs with live Supabase refresh." />;
  }

  if (invoicesQuery.error) return <ErrorState title="Billing operations" message={invoicesQuery.error.message} />;
  if (paymentsQuery.error) return <ErrorState title="Billing operations" message={paymentsQuery.error.message} />;
  if (usageQuery.error) return <ErrorState title="Billing operations" message={usageQuery.error.message} />;

  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const usage = usageQuery.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Invoices", value: String(invoices.length), tone: "accent" },
          { label: "Payments", value: String(payments.length) },
          { label: "Usage rows", value: String(usage.length) }
        ]}
      />
      <SectionCard title="Recent invoices" description="Latest generated or drafted invoices from the billing API.">
        <DataTable
          columns={["Invoice", "Total", "Status", "Due"]}
          rows={invoices.slice(0, 8).map((invoice) => [
            <Link href={`/billing/invoices/${invoice.id}` as Route} key={invoice.id}>
              {invoice.invoiceNumber}
            </Link>,
            formatMoney(invoice.total),
            <StatusPill key={`${invoice.id}-status`} label={invoice.status} tone={getStatusTone(invoice.status)} />,
            formatDateTime(invoice.dueDate)
          ])}
          emptyMessage="No invoices exist for this tenant yet."
        />
      </SectionCard>
      <SectionCard title="Recent payments" description="Latest payment attempts or settled collections.">
        <DataTable
          columns={["Amount", "Method", "Status", "Paid at"]}
          rows={payments.slice(0, 8).map((payment) => [
            formatMoney(Number(payment.amount ?? 0), String(payment.currency ?? "USD")),
            formatValue(payment.method),
            <StatusPill key={`${payment.id}-status`} label={String(payment.status ?? "pending")} tone={getStatusTone(String(payment.status ?? "pending"))} />,
            formatDateTime(String(payment.paid_at ?? ""))
          ])}
          emptyMessage="No payments exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveNotificationsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["admin", "notifications"],
    endpoint: "/api/notifications",
    table: "notifications",
    channelName: "notifications-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Notification queue" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Notification queue" message={query.error.message} />;

  const notifications = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Notifications", value: String(notifications.length), tone: "accent" },
          { label: "Sent", value: String(notifications.filter((item) => item.status === "sent").length) },
          { label: "Pending", value: String(notifications.filter((item) => item.status !== "sent").length), tone: "warning" }
        ]}
      />
      <SectionCard title="Notification queue" description="Updated automatically as records change.">
        <DataTable
          columns={["Channel", "Title", "Status", "Sent", "Created"]}
          rows={notifications.map((notification) => [
            formatValue(notification.channel),
            formatValue(notification.title),
            <StatusPill key={`${notification.id}-status`} label={String(notification.status ?? "pending")} tone={getStatusTone(String(notification.status ?? "pending"))} />,
            formatDateTime(String(notification.sent_at ?? "")),
            formatDateTime(String(notification.created_at ?? ""))
          ])}
          emptyMessage="No notifications exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveDocumentsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["admin", "documents"],
    endpoint: "/api/documents",
    table: "documents",
    channelName: "documents-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Document catalog" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Document catalog" message={query.error.message} />;

  const documents = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Documents", value: String(documents.length), tone: "accent" },
          { label: "Linked", value: String(documents.filter((document) => document.entity_id).length) },
          { label: "Storage", value: "Supabase Storage" }
        ]}
      />
      <SectionCard title="Document catalog" description="Updated automatically as records change.">
        <DataTable
          columns={["Name", "Entity", "Download", "Size", "Created"]}
          rows={documents.map((document) => [
            formatValue(document.name),
            formatValue(document.entity_type),
            typeof document.download_url === "string" && document.download_url.length > 0 ? (
              <a href={document.download_url} key={`${document.id}-download`} rel="noreferrer" target="_blank">
                Download
              </a>
            ) : (
              formatValue(document.storage_path)
            ),
            formatValue(document.size_bytes),
            formatDateTime(String(document.created_at ?? ""))
          ])}
          emptyMessage="No documents exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveRolesPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["admin", "roles"],
    endpoint: "/api/admin/roles",
    table: "roles",
    channelName: "roles-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Role definitions" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Role definitions" message={query.error.message} />;

  const roles = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Roles", value: String(roles.length), tone: "accent" },
          { label: "Permission sets", value: String(roles.filter((role) => role.permissions_json).length) },
          { label: "Scope", value: "tenant-specific" }
        ]}
      />
      <SectionCard title="Role definitions" description="Updated automatically as records change.">
        <DataTable
          columns={["Role", "Permissions", "Created"]}
          rows={roles.map((role) => [
            formatValue(role.name),
            formatValue(role.permissions_json),
            formatDateTime(String(role.created_at ?? ""))
          ])}
          emptyMessage="No roles exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveTenantsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["admin", "tenants"],
    endpoint: "/api/admin/tenants",
    table: "tenants",
    channelName: "tenants-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Tenant record" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Tenant record" message={query.error.message} />;

  const tenants = query.data ?? [];

  return (
    <SectionCard title="Tenant record" description="Updated automatically as records change.">
      <DataTable
        columns={["Name", "Slug", "Plan", "Status", "Created"]}
        rows={tenants.map((tenant) => [
          formatValue(tenant.name),
          formatValue(tenant.slug),
          formatValue(tenant.plan),
          <StatusPill key={`${tenant.id}-status`} label={String(tenant.status ?? "unknown")} tone={getStatusTone(String(tenant.status ?? "unknown"))} />,
          formatDateTime(String(tenant.created_at ?? ""))
        ])}
        emptyMessage="No tenant record was resolved for the current session."
      />
    </SectionCard>
  );
}

export function LiveUsersPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["admin", "users"],
    endpoint: "/api/admin/users",
    table: "user_profiles",
    channelName: "users-live-panel"
  });

  if (query.isLoading) return <LoadingState title="User profiles" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="User profiles" message={query.error.message} />;

  const users = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Users", value: String(users.length), tone: "accent" },
          { label: "Active", value: String(users.filter((user) => user.status === "active").length) },
          { label: "Departments", value: String(new Set(users.map((user) => user.department).filter(Boolean)).size) }
        ]}
      />
      <SectionCard title="User profiles" description="Updated automatically as records change.">
        <DataTable
          columns={["Name", "Department", "Status", "Created"]}
          rows={users.map((user) => [
            formatValue(user.full_name),
            formatValue(user.department),
            <StatusPill key={`${user.id}-status`} label={String(user.status ?? "unknown")} tone={getStatusTone(String(user.status ?? "unknown"))} />,
            formatDateTime(String(user.created_at ?? ""))
          ])}
          emptyMessage="No user profiles exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveWorkflowsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["admin", "workflows"],
    endpoint: "/api/workflows",
    table: "workflows",
    channelName: "workflows-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Workflow definitions" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Workflow definitions" message={query.error.message} />;

  const workflows = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Workflows", value: String(workflows.length), tone: "accent" },
          { label: "Active", value: String(workflows.filter((workflow) => workflow.status === "active").length) },
          { label: "Triggers", value: String(new Set(workflows.map((workflow) => workflow.triggerType)).size) }
        ]}
      />
      <SectionCard title="Workflow definitions" description="Updated automatically as records change.">
        <DataTable
          columns={["Workflow", "Trigger", "Version", "Status", "Steps"]}
          rows={workflows.map((workflow) => [
            <Link href={`/workflows/${workflow.id}` as Route} key={String(workflow.id)}>
              {formatValue(workflow.name)}
            </Link>,
            formatValue(workflow.triggerType),
            formatValue(workflow.version),
            <StatusPill key={`${workflow.id}-status`} label={String(workflow.status ?? "unknown")} tone={getStatusTone(String(workflow.status ?? "unknown"))} />,
            String(Array.isArray(workflow.steps) ? workflow.steps.length : 0)
          ])}
          emptyMessage="No workflows exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveElementsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "elements"],
    endpoint: "/api/inventory/elements",
    table: "network_elements",
    channelName: "elements-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Element inventory" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Element inventory" message={query.error.message} />;

  const elements = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Elements", value: String(elements.length), tone: "accent" },
          { label: "Active", value: String(elements.filter((element) => element.status === "active").length) },
          { label: "Types", value: String(new Set(elements.map((element) => element.type)).size) }
        ]}
      />
      <SectionCard title="Element inventory" description="Updated automatically as records change.">
        <DataTable
          columns={["Element", "Type", "Model", "IP", "Status", "Commissioned"]}
          rows={elements.map((element) => [
            <Link href={`/inventory/elements/${element.id}` as Route} key={String(element.id)}>
              {formatValue(element.name)}
            </Link>,
            formatValue(element.type),
            formatValue(element.model),
            formatValue(element.ip_address),
            <StatusPill key={`${element.id}-status`} label={String(element.status ?? "unknown")} tone={getStatusTone(String(element.status ?? "unknown"))} />,
            formatDateTime(String(element.commissioned_at ?? ""))
          ])}
          emptyMessage="No network elements exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveInterfacesPanel() {
  const interfacesQuery = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "interfaces"],
    endpoint: "/api/inventory/interfaces",
    table: "network_interfaces",
    channelName: "interfaces-live-panel"
  });
  const elementsQuery = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "elements", "names"],
    endpoint: "/api/inventory/elements",
    table: "network_elements",
    channelName: "interfaces-elements-live-panel"
  });

  if (interfacesQuery.isLoading || elementsQuery.isLoading) return <LoadingState title="Interface inventory" description="Loading the latest records for this view." />;
  if (interfacesQuery.error) return <ErrorState title="Interface inventory" message={interfacesQuery.error.message} />;
  if (elementsQuery.error) return <ErrorState title="Interface inventory" message={elementsQuery.error.message} />;

  const interfaces = interfacesQuery.data ?? [];
  const elementNames = new Map((elementsQuery.data ?? []).map((element) => [element.id, element.name]));

  return (
    <SectionCard title="Interface inventory" description="Updated automatically as records change.">
      <DataTable
        columns={["Interface", "Element", "Type", "Bandwidth", "Status"]}
        rows={interfaces.map((item) => [
          formatValue(item.interface_name),
          item.network_element_id ? (
            <Link href={`/inventory/elements/${item.network_element_id}` as Route} key={String(item.id)}>
              {formatValue(elementNames.get(item.network_element_id) ?? item.network_element_id)}
            </Link>
          ) : (
            "—"
          ),
          formatValue(item.type),
          item.bandwidth_mbps ? `${item.bandwidth_mbps} Mbps` : "—",
          <StatusPill key={`${item.id}-status`} label={String(item.status ?? "unknown")} tone={getStatusTone(String(item.status ?? "unknown"))} />
        ])}
        emptyMessage="No interfaces exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveAssetsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "assets"],
    endpoint: "/api/inventory/assets",
    table: "assets",
    channelName: "assets-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Asset register" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Asset register" message={query.error.message} />;

  const assets = query.data ?? [];

  return (
    <SectionCard title="Asset register" description="Updated automatically as records change.">
      <DataTable
        columns={["Asset", "Type", "Location", "Assigned to", "Status"]}
        rows={assets.map((asset) => [
          formatValue(asset.name),
          formatValue(asset.asset_type),
          formatValue(asset.location_id),
          formatValue(asset.assigned_to),
          <StatusPill key={`${asset.id}-status`} label={String(asset.status ?? "unknown")} tone={getStatusTone(String(asset.status ?? "unknown"))} />
        ])}
        emptyMessage="No assets exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveAlarmsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "alarms"],
    endpoint: "/api/faults/alarms",
    table: "alarms",
    channelName: "alarms-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Alarm stream" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Alarm stream" message={query.error.message} />;

  const alarms = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Alarms", value: String(alarms.length), tone: "accent" },
          { label: "Active", value: String(alarms.filter((alarm) => alarm.status === "active").length) },
          { label: "Critical", value: String(alarms.filter((alarm) => alarm.severity === "critical").length), tone: "warning" }
        ]}
      />
      <SectionCard title="Alarm stream" description="Updated automatically as records change.">
        <DataTable
          columns={["Severity", "Element", "Source", "Status", "Raised", "Cleared"]}
          rows={alarms.map((alarm) => [
            formatValue(alarm.severity),
            formatValue(alarm.network_element_id),
            formatValue(alarm.source),
            <StatusPill key={`${alarm.id}-status`} label={String(alarm.status ?? "unknown")} tone={getStatusTone(String(alarm.status ?? "unknown"))} />,
            formatDateTime(String(alarm.raised_at ?? "")),
            formatDateTime(String(alarm.cleared_at ?? ""))
          ])}
          emptyMessage="No alarms exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LivePerformancePanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "performance"],
    endpoint: "/api/performance",
    table: "performance_metrics",
    channelName: "performance-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Recent metrics" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Recent metrics" message={query.error.message} />;

  const metrics = query.data ?? [];

  return (
    <SectionCard title="Recent metrics" description="Updated automatically as records change.">
      <DataTable
        columns={["Metric", "Value", "Unit", "Recorded"]}
        rows={metrics.map((metric) => [
          formatValue(metric.metric_type),
          formatValue(metric.value),
          formatValue(metric.unit),
          formatDateTime(String(metric.recorded_at ?? ""))
        ])}
        emptyMessage="No performance metrics exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveProvisioningPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "services"],
    endpoint: "/api/services",
    table: "service_instances",
    channelName: "services-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Service instances" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Service instances" message={query.error.message} />;

  const services = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Services", value: String(services.length), tone: "accent" },
          { label: "Active", value: String(services.filter((service) => service.status === "active").length) },
          { label: "Pending", value: String(services.filter((service) => service.status === "pending").length), tone: "warning" }
        ]}
      />
      <SectionCard title="Service instances" description="Updated automatically as records change.">
        <DataTable
          columns={["Service", "Customer", "Product", "Element", "Status", "Activated"]}
          rows={services.map((service) => [
            <Link href={`/provisioning/${service.id}` as Route} key={String(service.id)}>
              {formatValue(service.id)}
            </Link>,
            formatValue(service.customer_id),
            formatValue(service.product_id),
            formatValue(service.network_element_id),
            <StatusPill key={`${service.id}-status`} label={String(service.status ?? "unknown")} tone={getStatusTone(String(service.status ?? "unknown"))} />,
            formatDateTime(String(service.activated_at ?? ""))
          ])}
          emptyMessage="No service instances exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveConfigurationPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "configuration", "elements"],
    endpoint: "/api/inventory/elements",
    table: "network_elements",
    channelName: "configuration-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Configuration targets" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Configuration targets" message={query.error.message} />;

  const elements = query.data ?? [];

  return (
    <SectionCard title="Configuration targets" description="Updated automatically as records change.">
      <DataTable
        columns={["Element", "Type", "Model", "Status", "Inspect"]}
        rows={elements.map((element) => [
          formatValue(element.name),
          formatValue(element.type),
          formatValue(element.model),
          <StatusPill key={`${element.id}-status`} label={String(element.status ?? "unknown")} tone={getStatusTone(String(element.status ?? "unknown"))} />,
          <Link href={`/configuration/${element.id}` as Route} key={`cfg-${String(element.id)}`}>
            Open
          </Link>
        ])}
        emptyMessage="No network elements exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveSlaPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["bss", "sla"],
    endpoint: "/api/sla",
    table: "slas",
    channelName: "sla-live-panel"
  });

  if (query.isLoading) return <LoadingState title="SLA definitions" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="SLA definitions" message={query.error.message} />;

  const slas = query.data ?? [];

  return (
    <SectionCard title="SLA definitions" description="Updated automatically as records change.">
      <DataTable
        columns={["SLA", "Metric", "Target", "Window"]}
        rows={slas.map((sla) => [
          <Link href={`/sla/${sla.id}` as Route} key={String(sla.id)}>
            {formatValue(sla.name)}
          </Link>,
          formatValue(sla.metric_type),
          formatValue(sla.target_value),
          formatValue(sla.measurement_window)
        ])}
        emptyMessage="No SLAs exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveRevenueAssurancePanel() {
  const query = useRevenue();

  useLiveQueryInvalidation({
    channelName: "revenue-assurance-live-panel",
    queryKeys: [["revenue", "assurance"]],
    table: "revenue_assurance_jobs"
  });

  if (query.isLoading) return <LoadingState title="Assurance runs" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Assurance runs" message={query.error.message} />;

  const jobs = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Jobs", value: String(jobs.length), tone: "accent" },
          { label: "Pending", value: String(jobs.filter((job) => job.status === "pending").length), tone: "warning" },
          { label: "Latest leakage", value: `${Number(jobs[0]?.leakagePct ?? 0).toFixed(4)}%` }
        ]}
      />
      <SectionCard title="Assurance runs" description="Updated automatically as records change.">
        <DataTable
          columns={["Job", "Status", "Leakage %"]}
          rows={jobs.map((job) => [
            <Link href={`/revenue/assurance/${job.id}` as Route} key={job.id}>
              {job.id}
            </Link>,
            <StatusPill key={`${job.id}-status`} label={job.status} tone={getStatusTone(job.status)} />,
            `${Number(job.leakagePct ?? 0).toFixed(4)}%`
          ])}
          emptyMessage="No assurance jobs exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveSettlementPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["revenue", "settlement"],
    endpoint: "/api/revenue/settlement",
    table: "settlement_statements",
    channelName: "settlement-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Partner statements" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Partner statements" message={query.error.message} />;

  const settlements = query.data ?? [];

  return (
    <SectionCard title="Partner statements" description="Updated automatically as records change.">
      <DataTable
        columns={["Statement", "Partner", "Direction", "Net", "Status", "Due"]}
        rows={settlements.map((statement) => [
          <Link href={`/revenue/settlement/${statement.id}` as Route} key={String(statement.id)}>
            {formatValue(statement.id)}
          </Link>,
          `${formatValue(statement.partner_type)} / ${formatValue(statement.partner_id)}`,
          formatValue(statement.direction),
          formatMoney(Number(statement.net_amount ?? 0), String(statement.currency ?? "USD")),
          <StatusPill key={`${statement.id}-status`} label={String(statement.status ?? "unknown")} tone={getStatusTone(String(statement.status ?? "unknown"))} />,
          formatDateTime(String(statement.due_date ?? ""))
        ])}
        emptyMessage="No settlement statements exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveReportsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["revenue", "reports"],
    endpoint: "/api/revenue/reports",
    table: "financial_reports",
    channelName: "reports-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Report catalog" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Report catalog" message={query.error.message} />;

  const reports = query.data ?? [];

  return (
    <SectionCard title="Report catalog" description="Updated automatically as records change.">
      <DataTable
        columns={["Type", "Period", "Generated by", "Generated at", "Payload"]}
        rows={reports.map((report) => [
          formatValue(report.report_type),
          `${formatDateTime(String(report.period_start ?? ""))} to ${formatDateTime(String(report.period_end ?? ""))}`,
          formatValue(report.generated_by),
          formatDateTime(String(report.generated_at ?? "")),
          formatValue(report.payload_json)
        ])}
        emptyMessage="No revenue reports exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveReconciliationPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["revenue", "reconciliation"],
    endpoint: "/api/revenue/reconciliation",
    table: "reconciliation_runs",
    channelName: "reconciliation-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Period close runs" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Period close runs" message={query.error.message} />;

  const runs = query.data ?? [];

  return (
    <SectionCard title="Period close runs" description="Updated automatically as records change.">
      <DataTable
        columns={["Run", "Status", "Net revenue", "Approved", "Created"]}
        rows={runs.map((run) => [
          <Link href={`/revenue/reconciliation/${run.id}` as Route} key={String(run.id)}>
            {formatValue(run.id)}
          </Link>,
          <StatusPill key={`${run.id}-status`} label={String(run.status ?? "unknown")} tone={getStatusTone(String(run.status ?? "unknown"))} />,
          formatMoney(Number(run.net_revenue ?? 0)),
          formatDateTime(String(run.approved_at ?? "")),
          formatDateTime(String(run.created_at ?? ""))
        ])}
        emptyMessage="No reconciliation runs exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveTicketsPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["oss", "tickets"],
    endpoint: "/api/faults/tickets",
    table: "trouble_tickets",
    channelName: "tickets-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Ticket queue" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Ticket queue" message={query.error.message} />;

  const tickets = query.data ?? [];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Tickets", value: String(tickets.length), tone: "accent" },
          { label: "Open", value: String(tickets.filter((ticket) => ticket.status === "open").length), tone: "warning" },
          { label: "Critical", value: String(tickets.filter((ticket) => ticket.severity === "critical").length) }
        ]}
      />
      <SectionCard title="Ticket queue" description="Updated automatically as records change.">
        <DataTable
          columns={["Ticket", "Title", "Severity", "Status", "Element", "Created"]}
          rows={tickets.map((ticket) => [
            <Link href={`/faults/tickets/${ticket.id}` as Route} key={String(ticket.id)}>
              {formatValue(ticket.ticket_number)}
            </Link>,
            formatValue(ticket.title),
            formatValue(ticket.severity),
            <StatusPill key={`${ticket.id}-status`} label={String(ticket.status ?? "unknown")} tone={getStatusTone(String(ticket.status ?? "unknown"))} />,
            formatValue(ticket.network_element_id),
            formatDateTime(String(ticket.created_at ?? ""))
          ])}
          emptyMessage="No trouble tickets exist for this tenant yet."
        />
      </SectionCard>
    </div>
  );
}

export function LiveAuditPanel() {
  const query = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["admin", "audit"],
    endpoint: "/api/audit",
    table: "audit_logs",
    channelName: "audit-live-panel"
  });

  if (query.isLoading) return <LoadingState title="Audit log" description="Loading the latest records for this view." />;
  if (query.error) return <ErrorState title="Audit log" message={query.error.message} />;

  const audits = query.data ?? [];

  return (
    <SectionCard title="Audit log" description="Updated automatically as records change.">
      <DataTable
        columns={["Action", "Entity", "User", "Timestamp"]}
        rows={audits.map((entry) => [
          formatValue(entry.action),
          `${formatValue(entry.entity_type)} / ${formatValue(entry.entity_id)}`,
          formatValue(entry.user_id),
          formatDateTime(String(entry.created_at ?? ""))
        ])}
        emptyMessage="No audit logs exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveRatingRulesPanel() {
  const rulesQuery = useLiveRestCollection<Record<string, unknown>>({
    queryKey: ["billing", "rating-rules"],
    endpoint: "/api/billing/rating-rules",
    table: "rating_rules",
    channelName: "rating-rules-live-panel"
  });
  const productsQuery = useProducts();

  useLiveQueryInvalidation({
    channelName: "rating-rules-products-live-panel",
    queryKeys: [["products"]],
    table: "products"
  });

  if (rulesQuery.isLoading || productsQuery.isLoading) {
    return <LoadingState title="Charging rules" description="Loading the latest records for this view." />;
  }
  if (rulesQuery.error) return <ErrorState title="Charging rules" message={rulesQuery.error.message} />;
  if (productsQuery.error) return <ErrorState title="Charging rules" message={productsQuery.error.message} />;

  const rules = rulesQuery.data ?? [];
  const products = new Map((productsQuery.data ?? []).map((product) => [product.id, product.name]));

  return (
    <SectionCard title="Charging rules" description="Updated automatically as records change.">
      <DataTable
        columns={["Product", "Rule type", "Rate", "Priority", "Condition"]}
        rows={rules.map((rule) => [
          rule.product_id ? (
            <Link href={`/products/${rule.product_id}` as Route} key={String(rule.id)}>
              {products.get(String(rule.product_id)) ?? String(rule.product_id)}
            </Link>
          ) : (
            "—"
          ),
          formatValue(rule.rule_type),
          `${formatValue(rule.rate)} ${formatValue(rule.currency ?? "USD")}`,
          formatValue(rule.priority),
          formatValue(rule.condition_json)
        ])}
        emptyMessage="No rating rules exist for this tenant yet."
      />
    </SectionCard>
  );
}

export function LiveAnalyticsPanel() {
  const query = useAnalyticsSnapshot();

  useLiveQueryInvalidation({
    channelName: "analytics-orders-live-panel",
    queryKeys: [["analytics", "snapshot"]],
    table: "orders"
  });
  useLiveQueryInvalidation({
    channelName: "analytics-invoices-live-panel",
    queryKeys: [["analytics", "snapshot"]],
    table: "invoices"
  });
  useLiveQueryInvalidation({
    channelName: "analytics-payments-live-panel",
    queryKeys: [["analytics", "snapshot"]],
    table: "payments"
  });
  useLiveQueryInvalidation({
    channelName: "analytics-metrics-live-panel",
    queryKeys: [["analytics", "snapshot"]],
    table: "performance_metrics"
  });
  useLiveQueryInvalidation({
    channelName: "analytics-webhook-deliveries-live-panel",
    queryKeys: [["analytics", "snapshot"]],
    table: "webhook_deliveries"
  });
  useLiveQueryInvalidation({
    channelName: "analytics-connector-executions-live-panel",
    queryKeys: [["analytics", "snapshot"]],
    table: "connector_executions"
  });
  useLiveQueryInvalidation({
    channelName: "analytics-tickets-live-panel",
    queryKeys: [["analytics", "snapshot"]],
    table: "trouble_tickets"
  });
  useLiveQueryInvalidation({
    channelName: "analytics-revenue-jobs-live-panel",
    queryKeys: [["analytics", "snapshot"]],
    table: "revenue_assurance_jobs"
  });

  if (query.isLoading) {
    return <LoadingState title="Unified KPI dashboard" description="Loading the latest records for this view." />;
  }

  if (query.error) {
    return <ErrorState title="Unified KPI dashboard" message={query.error.message} />;
  }

  const snapshot = query.data;

  if (!snapshot) {
    return <ErrorState title="Unified KPI dashboard" message="No analytics snapshot is available." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <KpiCard title="Uptime %" value={snapshot.uptimePct30d.toFixed(2)} />
      <KpiCard title="Order processing hrs" value={snapshot.medianOrderProcessingHours.toFixed(2)} />
      <KpiCard title="Invoice to payment hrs" value={snapshot.invoiceToPaymentHours.toFixed(2)} />
      <KpiCard title="Fault resolution hrs" value={snapshot.faultResolutionHours.toFixed(2)} />
      <KpiCard title="Billing accuracy %" value={`${snapshot.billingAccuracyRate.toFixed(2)}%`} />
      <KpiCard title="Revenue leakage %" value={`${snapshot.revenueLeakagePct.toFixed(4)}%`} />
      <KpiCard title="Webhook success %" value={`${snapshot.webhookDeliverySuccessPct.toFixed(2)}%`} />
      <KpiCard title="Connector success %" value={`${snapshot.connectorExecutionSuccessRate.toFixed(2)}%`} />
      <KpiCard title="Active tenants" value={String(snapshot.activeTenants)} />
      <KpiCard title="Daily active users" value={String(snapshot.dailyActiveUsers)} />
      <KpiCard title="API p95 ms" value={snapshot.vercelP95Ms.toFixed(2)} />
    </div>
  );
}
