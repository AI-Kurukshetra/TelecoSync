"use client";

import { NetworkMap } from "@/components/oss/NetworkMap";
import { PerformanceChart } from "@/components/oss/PerformanceChart";
import { ProvisioningStatus } from "@/components/oss/ProvisioningStatus";
import { TicketList } from "@/components/oss/TicketList";
import { ModulePage } from "@/components/layout/ModulePage";
import { DataTable } from "@/components/ui/DataTable";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  ErrorModulePage,
  LoadingModulePage,
  NotFoundModulePage,
  formatDateTime,
  formatValue,
  getQueryErrorMessage,
  getStatusTone,
  hoursBetween,
  useLiveRestCollection,
  useLiveRestResource
} from "@/components/live/live-utils";

type ElementRecord = {
  id: string;
  name: string;
  type: string;
  model?: string | null;
  serial_number?: string | null;
  ip_address?: string | null;
  location_id?: string | null;
  status: string;
  commissioned_at?: string | null;
  metadata_json?: unknown;
};

type InterfaceRecord = {
  id: string;
  network_element_id: string;
  interface_name: string;
  type?: string | null;
  bandwidth_mbps?: number | null;
  status: string;
};

type AssetRecord = {
  id: string;
  name: string;
  asset_type?: string | null;
  status: string;
  assigned_to?: string | null;
};

type MetricRecord = {
  id: string;
  network_element_id: string;
  metric_type: string;
  value?: number | null;
  unit?: string | null;
  recorded_at?: string | null;
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
  created_at?: string | null;
};

type AlarmRecord = {
  id: string;
  network_element_id?: string | null;
  severity: string;
  description?: string | null;
  status: string;
  raised_at?: string | null;
  cleared_at?: string | null;
};

type TicketRecord = {
  id: string;
  ticket_number: string;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  assigned_to?: string | null;
  network_element_id?: string | null;
  service_instance_id?: string | null;
  created_at?: string | null;
  resolved_at?: string | null;
};

function getFirstError(...errors: unknown[]) {
  return errors.find(Boolean);
}

export function LiveInventoryElementDetailPage({ id }: { id: string }) {
  const elementQuery = useLiveRestResource<ElementRecord>({
    endpoint: `/api/inventory/elements/${id}`,
    queryKey: ["inventory", "elements", id],
    subscriptions: [
      { channelName: `inventory-element-${id}`, queryKeys: [["inventory", "elements", id]], table: "network_elements" }
    ]
  });
  const interfacesQuery = useLiveRestCollection<InterfaceRecord>({
    endpoint: "/api/inventory/interfaces",
    queryKey: ["inventory", "elements", id, "interfaces"],
    subscriptions: [
      { channelName: `inventory-element-${id}-interfaces`, queryKeys: [["inventory", "elements", id, "interfaces"]], table: "network_interfaces" }
    ]
  });
  const metricsQuery = useLiveRestCollection<MetricRecord>({
    endpoint: "/api/performance",
    queryKey: ["inventory", "elements", id, "metrics"],
    subscriptions: [
      { channelName: `inventory-element-${id}-metrics`, queryKeys: [["inventory", "elements", id, "metrics"]], table: "performance_metrics" }
    ]
  });
  const assetsQuery = useLiveRestCollection<AssetRecord>({
    endpoint: "/api/inventory/assets",
    queryKey: ["inventory", "elements", id, "assets"],
    subscriptions: [
      { channelName: `inventory-element-${id}-assets`, queryKeys: [["inventory", "elements", id, "assets"]], table: "assets" }
    ]
  });

  if (elementQuery.isLoading || interfacesQuery.isLoading || metricsQuery.isLoading || assetsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="OSS / Inventory / Element Detail"
        title="Inventory element detail"
        description="Operational inventory detail, interfaces, recent metrics, and assigned assets for the selected network element."
        message="Loading the network element and related operational inventory data."
      />
    );
  }

  const error = getFirstError(elementQuery.error, interfacesQuery.error, metricsQuery.error, assetsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="OSS / Inventory / Element Detail"
        title="Inventory element detail"
        description="Operational inventory detail, interfaces, recent metrics, and assigned assets for the selected network element."
        message={getQueryErrorMessage(error, "Unable to load inventory element detail.")}
      />
    );
  }

  const element = elementQuery.data;
  if (!element) {
    return (
      <NotFoundModulePage
        eyebrow="OSS / Inventory / Element Detail"
        title="Inventory element detail"
        description="Operational inventory detail, interfaces, recent metrics, and assigned assets for the selected network element."
        message="No network element was found for this tenant and route."
      />
    );
  }

  const interfaces = (interfacesQuery.data ?? []).filter((item) => item.network_element_id === id);
  const metrics = (metricsQuery.data ?? []).filter((item) => item.network_element_id === id);
  const assets = (assetsQuery.data ?? []).filter((item) => item.assigned_to === id);

  return (
    <ModulePage
      eyebrow="OSS / Inventory / Element Detail"
      title={element.name}
      description="Operational inventory detail, interfaces, recent metrics, and assigned assets for the selected network element."
      stats={[
        { label: "Type", value: element.type },
        { label: "Interfaces", value: String(interfaces.length) },
        { label: "Assets", value: String(assets.length) }
      ]}
    >
      <NetworkMap
        stats={[
          { label: "Element", value: element.type, tone: "accent" },
          { label: "Interfaces", value: String(interfaces.length) },
          { label: "Metrics", value: String(metrics.length) },
          { label: "Assets", value: String(assets.length) }
        ]}
      />
      <SectionCard title="Element summary" description="Core inventory metadata and device status.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Model", element.model ?? "—"],
            ["Serial number", element.serial_number ?? "—"],
            ["IP address", formatValue(element.ip_address)],
            ["Location", formatValue(element.location_id)],
            ["Status", <StatusPill key="detail-status" label={element.status} tone={getStatusTone(element.status)} />],
            ["Metadata", formatValue(element.metadata_json)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Interfaces" description="Interfaces linked to this network element.">
        <DataTable
          columns={["Interface", "Type", "Bandwidth", "Status"]}
          rows={interfaces.map((item) => [
            item.interface_name,
            item.type ?? "—",
            item.bandwidth_mbps ? `${item.bandwidth_mbps} Mbps` : "—",
            <StatusPill key={`${item.id}-status`} label={item.status} tone={getStatusTone(item.status)} />
          ])}
          emptyMessage="No interfaces exist for this element yet."
        />
      </SectionCard>
      <SectionCard title="Recent metrics" description="Latest performance readings captured for this element.">
        <DataTable
          columns={["Metric", "Value", "Unit", "Recorded"]}
          rows={metrics.slice(0, 12).map((metric) => [
            metric.metric_type,
            String(metric.value ?? "—"),
            metric.unit ?? "—",
            formatDateTime(metric.recorded_at)
          ])}
          emptyMessage="No metrics exist for this element yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveProvisioningDetailPage({ instanceId }: { instanceId: string }) {
  const serviceQuery = useLiveRestResource<ServiceRecord>({
    endpoint: `/api/services/${instanceId}`,
    queryKey: ["services", instanceId],
    subscriptions: [
      { channelName: `service-${instanceId}`, queryKeys: [["services", instanceId]], table: "service_instances" }
    ]
  });

  if (serviceQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="OSS / Provisioning / Detail"
        title="Provisioning detail"
        description="Provisioning state, attached resources, and configuration payload for the selected service instance."
        message="Loading the service instance."
      />
    );
  }

  if (serviceQuery.error) {
    return (
      <ErrorModulePage
        eyebrow="OSS / Provisioning / Detail"
        title="Provisioning detail"
        description="Provisioning state, attached resources, and configuration payload for the selected service instance."
        message={getQueryErrorMessage(serviceQuery.error, "Unable to load provisioning detail.")}
      />
    );
  }

  const service = serviceQuery.data;
  if (!service) {
    return (
      <NotFoundModulePage
        eyebrow="OSS / Provisioning / Detail"
        title="Provisioning detail"
        description="Provisioning state, attached resources, and configuration payload for the selected service instance."
        message="No service instance was found for this tenant and route."
      />
    );
  }

  return (
    <ModulePage
      eyebrow="OSS / Provisioning / Detail"
      title={service.id}
      description="Provisioning state, attached resources, and configuration payload for the selected service instance."
      stats={[
        { label: "Status", value: service.status },
        { label: "Customer", value: formatValue(service.customer_id) },
        { label: "Product", value: formatValue(service.product_id) }
      ]}
    >
      <ProvisioningStatus
        detail={
          service.network_element_id
            ? `Attached to network element ${service.network_element_id}.`
            : "Awaiting network element assignment."
        }
        status={service.status}
      />
      <SectionCard title="Service instance" description="Provisioning metadata and current activation state.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Customer ID", formatValue(service.customer_id)],
            ["Product ID", formatValue(service.product_id)],
            ["Network element", formatValue(service.network_element_id)],
            ["Status", <StatusPill key="service-status" label={service.status} tone={getStatusTone(service.status)} />],
            ["Activated", formatDateTime(service.activated_at)],
            ["Deactivated", formatDateTime(service.deactivated_at)],
            ["Configuration", formatValue(service.config_json)]
          ]}
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LivePerformanceDetailPage({ elementId }: { elementId: string }) {
  const elementQuery = useLiveRestResource<ElementRecord>({
    endpoint: `/api/inventory/elements/${elementId}`,
    queryKey: ["performance", "element", elementId],
    subscriptions: [
      { channelName: `performance-element-${elementId}`, queryKeys: [["performance", "element", elementId]], table: "network_elements" }
    ]
  });
  const metricsQuery = useLiveRestCollection<MetricRecord>({
    endpoint: "/api/performance",
    queryKey: ["performance", "element", elementId, "metrics"],
    subscriptions: [
      { channelName: `performance-element-${elementId}-metrics`, queryKeys: [["performance", "element", elementId, "metrics"]], table: "performance_metrics" }
    ]
  });

  if (elementQuery.isLoading || metricsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="OSS / Performance / Detail"
        title="Performance detail"
        description="Performance samples captured for the selected network element."
        message="Loading the network element and performance samples."
      />
    );
  }

  const error = getFirstError(elementQuery.error, metricsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="OSS / Performance / Detail"
        title="Performance detail"
        description="Performance samples captured for the selected network element."
        message={getQueryErrorMessage(error, "Unable to load performance detail.")}
      />
    );
  }

  const element = elementQuery.data;
  if (!element) {
    return (
      <NotFoundModulePage
        eyebrow="OSS / Performance / Detail"
        title="Performance detail"
        description="Performance samples captured for the selected network element."
        message="No network element was found for this tenant and route."
      />
    );
  }

  const metrics = (metricsQuery.data ?? []).filter((item) => item.network_element_id === elementId);

  return (
    <ModulePage
      eyebrow="OSS / Performance / Detail"
      title={element.name}
      description="Performance samples captured for the selected network element."
      stats={[
        { label: "Type", value: element.type },
        { label: "Status", value: element.status },
        { label: "Samples", value: String(metrics.length) }
      ]}
    >
      <PerformanceChart
        stats={[
          { label: "Samples", value: String(metrics.length), tone: "accent" },
          { label: "Latest metric", value: metrics[0]?.metric_type ?? "—" },
          { label: "Latest value", value: metrics[0]?.value !== undefined && metrics[0]?.value !== null ? String(metrics[0]?.value) : "—" },
          { label: "Last recorded", value: formatDateTime(metrics[0]?.recorded_at) }
        ]}
      />
      <SectionCard title="Metric samples" description="Recent metrics for the selected network element.">
        <DataTable
          columns={["Metric", "Value", "Unit", "Recorded"]}
          rows={metrics.map((metric) => [
            metric.metric_type,
            String(metric.value ?? "—"),
            metric.unit ?? "—",
            formatDateTime(metric.recorded_at)
          ])}
          emptyMessage="No performance metrics exist for this element yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveConfigurationDetailPage({ elementId }: { elementId: string }) {
  const elementQuery = useLiveRestResource<ElementRecord>({
    endpoint: `/api/inventory/elements/${elementId}`,
    queryKey: ["configuration", "element", elementId],
    subscriptions: [
      { channelName: `configuration-element-${elementId}`, queryKeys: [["configuration", "element", elementId]], table: "network_elements" }
    ]
  });
  const servicesQuery = useLiveRestCollection<ServiceRecord>({
    endpoint: "/api/services",
    queryKey: ["configuration", "element", elementId, "services"],
    subscriptions: [
      { channelName: `configuration-element-${elementId}-services`, queryKeys: [["configuration", "element", elementId, "services"]], table: "service_instances" }
    ]
  });
  const interfacesQuery = useLiveRestCollection<InterfaceRecord>({
    endpoint: "/api/inventory/interfaces",
    queryKey: ["configuration", "element", elementId, "interfaces"],
    subscriptions: [
      { channelName: `configuration-element-${elementId}-interfaces`, queryKeys: [["configuration", "element", elementId, "interfaces"]], table: "network_interfaces" }
    ]
  });

  if (elementQuery.isLoading || servicesQuery.isLoading || interfacesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="OSS / Configuration / Detail"
        title="Configuration detail"
        description="Configuration metadata, interface inventory, and attached services for the selected network element."
        message="Loading the network element, interfaces, and attached services."
      />
    );
  }

  const error = getFirstError(elementQuery.error, servicesQuery.error, interfacesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="OSS / Configuration / Detail"
        title="Configuration detail"
        description="Configuration metadata, interface inventory, and attached services for the selected network element."
        message={getQueryErrorMessage(error, "Unable to load configuration detail.")}
      />
    );
  }

  const element = elementQuery.data;
  if (!element) {
    return (
      <NotFoundModulePage
        eyebrow="OSS / Configuration / Detail"
        title="Configuration detail"
        description="Configuration metadata, interface inventory, and attached services for the selected network element."
        message="No network element was found for this tenant and route."
      />
    );
  }

  const services = (servicesQuery.data ?? []).filter((item) => item.network_element_id === elementId);
  const interfaces = (interfacesQuery.data ?? []).filter((item) => item.network_element_id === elementId);

  return (
    <ModulePage
      eyebrow="OSS / Configuration / Detail"
      title={element.name}
      description="Configuration metadata, interface inventory, and attached services for the selected network element."
      stats={[
        { label: "Type", value: element.type },
        { label: "Interfaces", value: String(interfaces.length) },
        { label: "Services", value: String(services.length) }
      ]}
    >
      <SectionCard title="Element configuration" description="Primary device metadata and stored configuration payload.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Model", element.model ?? "—"],
            ["Serial number", element.serial_number ?? "—"],
            ["IP address", formatValue(element.ip_address)],
            ["Status", <StatusPill key="element-status" label={element.status} tone={getStatusTone(element.status)} />],
            ["Commissioned", formatDateTime(element.commissioned_at)],
            ["Metadata", formatValue(element.metadata_json)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Interfaces" description="Interfaces currently configured on this network element.">
        <DataTable
          columns={["Interface", "Type", "Bandwidth", "Status"]}
          rows={interfaces.map((item) => [
            item.interface_name,
            item.type ?? "—",
            item.bandwidth_mbps ? `${item.bandwidth_mbps} Mbps` : "—",
            <StatusPill key={`${item.id}-status`} label={item.status} tone={getStatusTone(item.status)} />
          ])}
          emptyMessage="No interfaces exist for this element yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveFaultTicketDetailPage({ id }: { id: string }) {
  const ticketQuery = useLiveRestResource<TicketRecord>({
    endpoint: `/api/faults/tickets/${id}`,
    queryKey: ["faults", "tickets", id],
    subscriptions: [
      { channelName: `fault-ticket-${id}`, queryKeys: [["faults", "tickets", id]], table: "trouble_tickets" }
    ]
  });
  const alarmsQuery = useLiveRestCollection<AlarmRecord>({
    endpoint: "/api/faults/alarms",
    queryKey: ["faults", "tickets", id, "alarms"],
    subscriptions: [
      { channelName: `fault-ticket-${id}-alarms`, queryKeys: [["faults", "tickets", id, "alarms"]], table: "alarms" }
    ]
  });

  if (ticketQuery.isLoading || alarmsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="OSS / Faults / Ticket Detail"
        title="Fault ticket detail"
        description="Trouble ticket metadata and related alarm context for the selected fault."
        message="Loading the ticket and related alarm context."
      />
    );
  }

  const error = getFirstError(ticketQuery.error, alarmsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="OSS / Faults / Ticket Detail"
        title="Fault ticket detail"
        description="Trouble ticket metadata and related alarm context for the selected fault."
        message={getQueryErrorMessage(error, "Unable to load fault ticket detail.")}
      />
    );
  }

  const ticket = ticketQuery.data;
  if (!ticket) {
    return (
      <NotFoundModulePage
        eyebrow="OSS / Faults / Ticket Detail"
        title="Fault ticket detail"
        description="Trouble ticket metadata and related alarm context for the selected fault."
        message="No trouble ticket was found for this tenant and route."
      />
    );
  }

  const alarms = (alarmsQuery.data ?? []).filter((alarm) => alarm.network_element_id === ticket.network_element_id);

  return (
    <ModulePage
      eyebrow="OSS / Faults / Ticket Detail"
      title={ticket.ticket_number}
      description="Trouble ticket metadata and related alarm context for the selected fault."
      stats={[
        { label: "Severity", value: ticket.severity },
        { label: "Status", value: ticket.status },
        { label: "Related alarms", value: String(alarms.length) }
      ]}
    >
      <TicketList
        stats={[
          { label: "Severity", value: ticket.severity, tone: ticket.severity === "critical" ? "warning" : "default" },
          { label: "Status", value: ticket.status },
          { label: "Alarms", value: String(alarms.length) },
          { label: "Resolution hrs", value: hoursBetween(ticket.created_at, ticket.resolved_at)?.toFixed(2) ?? "—" }
        ]}
      />
      <SectionCard title="Ticket summary" description="Ticket metadata and linked operational entities.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Title", ticket.title],
            ["Description", ticket.description ?? "—"],
            ["Severity", ticket.severity],
            ["Status", <StatusPill key="ticket-status" label={ticket.status} tone={getStatusTone(ticket.status)} />],
            ["Assigned to", formatValue(ticket.assigned_to)],
            ["Network element", formatValue(ticket.network_element_id)],
            ["Service instance", formatValue(ticket.service_instance_id)],
            ["Created", formatDateTime(ticket.created_at)],
            ["Resolved", formatDateTime(ticket.resolved_at)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Related alarms" description="Recent alarms raised against the linked network element.">
        <DataTable
          columns={["Severity", "Description", "Status", "Raised", "Cleared"]}
          rows={alarms.map((alarm) => [
            alarm.severity,
            alarm.description ?? "—",
            <StatusPill key={`${alarm.id}-status`} label={alarm.status} tone={getStatusTone(alarm.status)} />,
            formatDateTime(alarm.raised_at),
            formatDateTime(alarm.cleared_at)
          ])}
          emptyMessage="No related alarms were found for this ticket."
        />
      </SectionCard>
    </ModulePage>
  );
}
