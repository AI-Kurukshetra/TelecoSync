"use client";

import Link from "next/link";
import { ApiRegistryTable } from "@/components/integrations/ApiRegistryTable";
import { ConnectorCard } from "@/components/integrations/ConnectorCard";
import { DeliveryLog } from "@/components/integrations/DeliveryLog";
import { ModulePage } from "@/components/layout/ModulePage";
import { DataTable } from "@/components/ui/DataTable";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  ErrorModulePage,
  LoadingModulePage,
  NotFoundModulePage,
  average,
  formatDateTime,
  formatValue,
  getQueryErrorMessage,
  getStatusTone,
  useLiveRestCollection,
  useLiveRestResource
} from "@/components/live/live-utils";

type UserRecord = {
  id: string;
  role_id?: string | null;
  full_name?: string | null;
  department?: string | null;
  status: string;
  created_at?: string | null;
};

type RoleRecord = {
  id: string;
  name: string;
  permissions_json?: unknown;
};

type WorkflowRecord = {
  id: string;
  name: string;
  triggerType: string;
  steps?: unknown;
  status: string;
  version?: number | null;
  createdAt?: string | null;
};

type WorkflowInstanceRecord = {
  id: string;
  entity_type: string;
  entity_id: string;
  current_step?: number | null;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
};

type WebhookRecord = {
  id: string;
  name: string;
  target_url: string;
  event_types: string[];
  headers_json?: unknown;
  enabled: boolean;
  created_at?: string | null;
};

type DeliveryRecord = {
  id: string;
  event_type: string;
  http_status?: number | null;
  status: string;
  attempt_number: number;
  delivered_at?: string | null;
  response_body?: string | null;
};

type ConnectorRecord = {
  id: string;
  name: string;
  connector_type: string;
  direction: string;
  system_type: string;
  config_json?: unknown;
  enabled: boolean;
  last_run_at?: string | null;
  last_run_status?: string | null;
  created_at?: string | null;
};

type ExecutionRecord = {
  id: string;
  connector_id: string;
  trigger_type: string;
  status: string;
  request_json?: unknown;
  response_json?: unknown;
  error_message?: string | null;
  duration_ms?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
};

type ApiRegistryRecord = {
  id: string;
  name: string;
  slug: string;
  version: string;
  standard?: string | null;
  base_url: string;
  spec_url?: string | null;
  auth_type: string;
  status: string;
  owner_team?: string | null;
  created_at?: string | null;
};

function getFirstError(...errors: unknown[]) {
  return errors.find(Boolean);
}

export function LiveUserDetailPage({ id }: { id: string }) {
  const userQuery = useLiveRestResource<UserRecord>({
    endpoint: `/api/admin/users/${id}`,
    queryKey: ["admin", "users", id],
    subscriptions: [
      { channelName: `user-${id}`, queryKeys: [["admin", "users", id]], table: "user_profiles" }
    ]
  });
  const rolesQuery = useLiveRestCollection<RoleRecord>({
    endpoint: "/api/admin/roles",
    queryKey: ["admin", "roles", id],
    subscriptions: [
      { channelName: `user-${id}-roles`, queryKeys: [["admin", "roles", id]], table: "roles" }
    ]
  });

  if (userQuery.isLoading || rolesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="Admin / Users / Detail"
        title="User detail"
        description="Tenant membership, role assignment, and lifecycle status for the selected user."
        message="Loading the user profile and role metadata."
      />
    );
  }

  const error = getFirstError(userQuery.error, rolesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="Admin / Users / Detail"
        title="User detail"
        description="Tenant membership, role assignment, and lifecycle status for the selected user."
        message={getQueryErrorMessage(error, "Unable to load user detail.")}
      />
    );
  }

  const user = userQuery.data;
  if (!user) {
    return (
      <NotFoundModulePage
        eyebrow="Admin / Users / Detail"
        title="User detail"
        description="Tenant membership, role assignment, and lifecycle status for the selected user."
        message="No user was found for this tenant and route."
      />
    );
  }

  const role = (rolesQuery.data ?? []).find((item) => item.id === user.role_id);

  return (
    <ModulePage
      eyebrow="Admin / Users / Detail"
      title={user.full_name ?? user.id}
      description="Tenant membership, role assignment, and lifecycle status for the selected user."
      stats={[
        { label: "Department", value: user.department ?? "—" },
        { label: "Status", value: user.status },
        { label: "Role", value: role?.name ?? "unassigned" }
      ]}
    >
      <SectionCard title="User profile" description="Current app-level user profile metadata for this tenant member.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["User ID", user.id],
            ["Department", user.department ?? "—"],
            ["Role", role?.name ?? "—"],
            ["Status", <StatusPill key="user-status" label={user.status} tone={getStatusTone(user.status)} />],
            ["Created", formatDateTime(user.created_at)],
            ["Permissions", formatValue(role?.permissions_json ?? null)]
          ]}
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveWorkflowDetailPage({ id }: { id: string }) {
  const workflowQuery = useLiveRestResource<WorkflowRecord>({
    endpoint: `/api/workflows/${id}`,
    queryKey: ["workflows", id],
    subscriptions: [
      { channelName: `workflow-${id}`, queryKeys: [["workflows", id]], table: "workflows" }
    ]
  });
  const instancesQuery = useLiveRestCollection<WorkflowInstanceRecord>({
    endpoint: `/api/workflows/${id}/instances`,
    queryKey: ["workflows", id, "instances"],
    subscriptions: [
      { channelName: `workflow-${id}-instances`, queryKeys: [["workflows", id, "instances"]], table: "workflow_instances" }
    ]
  });

  if (workflowQuery.isLoading || instancesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="Admin / Workflows / Detail"
        title="Workflow detail"
        description="Trigger definition, step payload, and recent workflow executions for the selected automation."
        message="Loading the workflow definition and execution instances."
      />
    );
  }

  const error = getFirstError(workflowQuery.error, instancesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="Admin / Workflows / Detail"
        title="Workflow detail"
        description="Trigger definition, step payload, and recent workflow executions for the selected automation."
        message={getQueryErrorMessage(error, "Unable to load workflow detail.")}
      />
    );
  }

  const workflow = workflowQuery.data;
  if (!workflow) {
    return (
      <NotFoundModulePage
        eyebrow="Admin / Workflows / Detail"
        title="Workflow detail"
        description="Trigger definition, step payload, and recent workflow executions for the selected automation."
        message="No workflow was found for this tenant and route."
      />
    );
  }

  const instances = instancesQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="Admin / Workflows / Detail"
      title={workflow.name}
      description="Trigger definition, step payload, and recent workflow executions for the selected automation."
      stats={[
        { label: "Trigger", value: workflow.triggerType },
        { label: "Version", value: String(workflow.version ?? 1) },
        { label: "Instances", value: String(instances.length) }
      ]}
    >
      <SectionCard title="Workflow definition" description="Configured metadata and step payload for this workflow.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Trigger type", workflow.triggerType],
            ["Status", <StatusPill key="workflow-status" label={workflow.status} tone={getStatusTone(workflow.status)} />],
            ["Version", String(workflow.version ?? 1)],
            ["Created", formatDateTime(workflow.createdAt)],
            ["Steps JSON", formatValue(workflow.steps)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Recent instances" description="Workflow instances that recently executed against business entities.">
        <DataTable
          columns={["Instance", "Entity", "Current step", "Status", "Started", "Completed"]}
          rows={instances.map((instance) => [
            instance.id,
            `${instance.entity_type} / ${instance.entity_id}`,
            String(instance.current_step ?? 0),
            <StatusPill key={`${instance.id}-status`} label={instance.status} tone={getStatusTone(instance.status)} />,
            formatDateTime(instance.started_at),
            formatDateTime(instance.completed_at)
          ])}
          emptyMessage="No workflow instances exist for this workflow yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveWebhookDetailPage({ id }: { id: string }) {
  const webhookQuery = useLiveRestResource<WebhookRecord>({
    endpoint: `/api/integrations/webhooks/${id}`,
    queryKey: ["integrations", "webhooks", id],
    subscriptions: [
      { channelName: `webhook-${id}`, queryKeys: [["integrations", "webhooks", id]], table: "webhook_subscriptions" }
    ]
  });
  const deliveriesQuery = useLiveRestCollection<DeliveryRecord>({
    endpoint: `/api/integrations/webhooks/${id}/deliveries`,
    queryKey: ["integrations", "webhooks", id, "deliveries"],
    subscriptions: [
      { channelName: `webhook-${id}-deliveries`, queryKeys: [["integrations", "webhooks", id, "deliveries"]], table: "webhook_deliveries" }
    ]
  });

  if (webhookQuery.isLoading || deliveriesQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="Admin / Integrations / Webhook Detail"
        title="Webhook detail"
        description="Delivery attempts and subscription metadata for the selected webhook endpoint."
        message="Loading the webhook subscription and delivery attempts."
      />
    );
  }

  const error = getFirstError(webhookQuery.error, deliveriesQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="Admin / Integrations / Webhook Detail"
        title="Webhook detail"
        description="Delivery attempts and subscription metadata for the selected webhook endpoint."
        message={getQueryErrorMessage(error, "Unable to load webhook detail.")}
      />
    );
  }

  const webhook = webhookQuery.data;
  if (!webhook) {
    return (
      <NotFoundModulePage
        eyebrow="Admin / Integrations / Webhook Detail"
        title="Webhook detail"
        description="Delivery attempts and subscription metadata for the selected webhook endpoint."
        message="No webhook subscription was found for this tenant and route."
      />
    );
  }

  const deliveries = deliveriesQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="Admin / Integrations / Webhook Detail"
      title={webhook.name}
      description="Delivery attempts and subscription metadata for the selected webhook endpoint."
      stats={[
        { label: "Events", value: String(webhook.event_types.length) },
        { label: "Enabled", value: webhook.enabled ? "yes" : "no" },
        { label: "Deliveries", value: String(deliveries.length) }
      ]}
    >
      <DeliveryLog
        description="Recent delivery performance and retry pressure for this subscription."
        stats={[
          { label: "Successful", value: String(deliveries.filter((delivery) => delivery.status === "success").length), tone: "accent" },
          { label: "Failed", value: String(deliveries.filter((delivery) => delivery.status === "failed").length), tone: "warning" },
          { label: "Retries", value: String(deliveries.filter((delivery) => delivery.attempt_number > 1).length) },
          { label: "Last HTTP", value: String(deliveries[0]?.http_status ?? "—") }
        ]}
      />
      <SectionCard title="Subscription metadata" description="Target URL and header metadata for this webhook.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Target URL", webhook.target_url],
            ["Events", webhook.event_types.join(", ")],
            ["Headers", formatValue(webhook.headers_json)],
            ["Enabled", <StatusPill key="webhook-enabled" label={webhook.enabled ? "enabled" : "disabled"} tone={getStatusTone(webhook.enabled ? "enabled" : "disabled")} />],
            ["Created", formatDateTime(webhook.created_at)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Delivery attempts" description="Latest outbound calls made for this subscription.">
        <DataTable
          columns={["Event", "HTTP", "Status", "Attempt", "Delivered", "Response"]}
          rows={deliveries.map((delivery) => [
            delivery.event_type,
            String(delivery.http_status ?? "—"),
            <StatusPill key={`${delivery.id}-status`} label={delivery.status} tone={getStatusTone(delivery.status)} />,
            String(delivery.attempt_number),
            formatDateTime(delivery.delivered_at),
            delivery.response_body ?? "—"
          ])}
          emptyMessage="No deliveries exist for this webhook yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveConnectorDetailPage({ id }: { id: string }) {
  const connectorQuery = useLiveRestResource<ConnectorRecord>({
    endpoint: `/api/integrations/connectors/${id}`,
    queryKey: ["integrations", "connectors", id],
    subscriptions: [
      { channelName: `connector-${id}`, queryKeys: [["integrations", "connectors", id]], table: "integration_connectors" }
    ]
  });
  const executionsQuery = useLiveRestCollection<ExecutionRecord>({
    endpoint: `/api/integrations/connectors/${id}/logs`,
    queryKey: ["integrations", "connectors", id, "logs"],
    subscriptions: [
      { channelName: `connector-${id}-logs`, queryKeys: [["integrations", "connectors", id, "logs"]], table: "connector_executions" }
    ]
  });

  if (connectorQuery.isLoading || executionsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="Admin / Integrations / Connector Detail"
        title="Connector detail"
        description="Connector configuration, run status, and execution history for the selected integration."
        message="Loading the connector definition and recent executions."
      />
    );
  }

  const error = getFirstError(connectorQuery.error, executionsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="Admin / Integrations / Connector Detail"
        title="Connector detail"
        description="Connector configuration, run status, and execution history for the selected integration."
        message={getQueryErrorMessage(error, "Unable to load connector detail.")}
      />
    );
  }

  const connector = connectorQuery.data;
  if (!connector) {
    return (
      <NotFoundModulePage
        eyebrow="Admin / Integrations / Connector Detail"
        title="Connector detail"
        description="Connector configuration, run status, and execution history for the selected integration."
        message="No connector was found for this tenant and route."
      />
    );
  }

  const executions = executionsQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="Admin / Integrations / Connector Detail"
      title={connector.name}
      description="Connector configuration, run status, and execution history for the selected integration."
      stats={[
        { label: "Type", value: connector.connector_type },
        { label: "Direction", value: connector.direction },
        { label: "Runs", value: String(executions.length) }
      ]}
    >
      <ConnectorCard
        stats={[
          { label: "Enabled", value: connector.enabled ? "yes" : "no", tone: connector.enabled ? "accent" : "warning" },
          { label: "Last run", value: connector.last_run_status ?? "never" },
          { label: "Failures", value: String(executions.filter((execution) => execution.status === "failed").length), tone: "warning" },
          { label: "Runs", value: String(executions.length) }
        ]}
      />
      <SectionCard title="Connector summary" description="Core connector metadata and non-secret configuration values.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["System type", connector.system_type],
            ["Enabled", <StatusPill key="connector-enabled" label={connector.enabled ? "enabled" : "disabled"} tone={getStatusTone(connector.enabled ? "enabled" : "disabled")} />],
            ["Last run at", formatDateTime(connector.last_run_at)],
            ["Last run status", connector.last_run_status ?? "—"],
            ["Created", formatDateTime(connector.created_at)],
            ["Configuration", formatValue(connector.config_json)]
          ]}
        />
      </SectionCard>
      <SectionCard title="Recent executions" description="Latest queued or completed runs for this connector.">
        <DataTable
          columns={["Execution", "Trigger", "Status", "Duration", "Started"]}
          rows={executions.slice(0, 12).map((execution) => [
            <Link className="font-semibold hover:underline" href={`/integrations/connectors/${connector.id}/logs`} key={execution.id}>
              {execution.id}
            </Link>,
            execution.trigger_type,
            <StatusPill key={`${execution.id}-status`} label={execution.status} tone={getStatusTone(execution.status)} />,
            execution.duration_ms ? `${execution.duration_ms} ms` : "—",
            formatDateTime(execution.started_at)
          ])}
          emptyMessage="No connector runs exist for this connector yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveConnectorLogsPage({ id }: { id: string }) {
  const connectorQuery = useLiveRestResource<ConnectorRecord>({
    endpoint: `/api/integrations/connectors/${id}`,
    queryKey: ["integrations", "connectors", id],
    subscriptions: [
      { channelName: `connector-logs-${id}`, queryKeys: [["integrations", "connectors", id]], table: "integration_connectors" }
    ]
  });
  const executionsQuery = useLiveRestCollection<ExecutionRecord>({
    endpoint: `/api/integrations/connectors/${id}/logs`,
    queryKey: ["integrations", "connectors", id, "logs"],
    subscriptions: [
      { channelName: `connector-logs-${id}-items`, queryKeys: [["integrations", "connectors", id, "logs"]], table: "connector_executions" }
    ]
  });

  if (connectorQuery.isLoading || executionsQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="Admin / Integrations / Connector Logs"
        title="Connector logs"
        description="Execution requests, responses, and failures captured for the selected connector."
        message="Loading the connector and its execution history."
      />
    );
  }

  const error = getFirstError(connectorQuery.error, executionsQuery.error);
  if (error) {
    return (
      <ErrorModulePage
        eyebrow="Admin / Integrations / Connector Logs"
        title="Connector logs"
        description="Execution requests, responses, and failures captured for the selected connector."
        message={getQueryErrorMessage(error, "Unable to load connector logs.")}
      />
    );
  }

  const connector = connectorQuery.data;
  if (!connector) {
    return (
      <NotFoundModulePage
        eyebrow="Admin / Integrations / Connector Logs"
        title="Connector logs"
        description="Execution requests, responses, and failures captured for the selected connector."
        message="No connector was found for this tenant and route."
      />
    );
  }

  const executions = executionsQuery.data ?? [];

  return (
    <ModulePage
      eyebrow="Admin / Integrations / Connector Logs"
      title={`${connector.name} logs`}
      description="Execution requests, responses, and failures captured for the selected connector."
      stats={[
        { label: "Connector", value: connector.connector_type },
        { label: "Executions", value: String(executions.length) },
        { label: "Failures", value: String(executions.filter((item) => item.status === "failed").length) }
      ]}
    >
      <DeliveryLog
        description="Execution volume, failure rate, and runtime characteristics for this connector."
        title="Execution health"
        stats={[
          { label: "Success", value: String(executions.filter((item) => item.status === "success").length), tone: "accent" },
          { label: "Failed", value: String(executions.filter((item) => item.status === "failed").length), tone: "warning" },
          { label: "Avg duration", value: `${Math.round(average(executions.map((item) => Number(item.duration_ms ?? 0)).filter((value) => value > 0)))} ms` },
          { label: "Triggers", value: String(new Set(executions.map((item) => item.trigger_type)).size) }
        ]}
      />
      <SectionCard title="Execution log" description="Recent connector executions with request and response payloads.">
        <DataTable
          columns={["Started", "Trigger", "Status", "Duration", "Error", "Response"]}
          rows={executions.map((execution) => [
            formatDateTime(execution.started_at),
            execution.trigger_type,
            <StatusPill key={`${execution.id}-status`} label={execution.status} tone={getStatusTone(execution.status)} />,
            execution.duration_ms ? `${execution.duration_ms} ms` : "—",
            execution.error_message ?? "—",
            formatValue(execution.response_json)
          ])}
          emptyMessage="No execution logs exist for this connector yet."
        />
      </SectionCard>
    </ModulePage>
  );
}

export function LiveApiRegistryDetailPage({ apiId }: { apiId: string }) {
  const apiQuery = useLiveRestResource<ApiRegistryRecord>({
    endpoint: `/api/integrations/registry/${apiId}`,
    queryKey: ["integrations", "registry", apiId],
    subscriptions: [
      { channelName: `api-registry-${apiId}`, queryKeys: [["integrations", "registry", apiId]], table: "api_registry" }
    ]
  });

  if (apiQuery.isLoading) {
    return (
      <LoadingModulePage
        eyebrow="Admin / Integrations / Registry Detail"
        title="API registry detail"
        description="Endpoint, standard, and ownership metadata for the selected API registry entry."
        message="Loading the API registry entry."
      />
    );
  }

  if (apiQuery.error) {
    return (
      <ErrorModulePage
        eyebrow="Admin / Integrations / Registry Detail"
        title="API registry detail"
        description="Endpoint, standard, and ownership metadata for the selected API registry entry."
        message={getQueryErrorMessage(apiQuery.error, "Unable to load API registry detail.")}
      />
    );
  }

  const api = apiQuery.data;
  if (!api) {
    return (
      <NotFoundModulePage
        eyebrow="Admin / Integrations / Registry Detail"
        title="API registry detail"
        description="Endpoint, standard, and ownership metadata for the selected API registry entry."
        message="No API registry entry was found for this tenant and route."
      />
    );
  }

  return (
    <ModulePage
      eyebrow="Admin / Integrations / Registry Detail"
      title={api.name}
      description="Endpoint, standard, and ownership metadata for the selected API registry entry."
      stats={[
        { label: "Standard", value: api.standard ?? "custom" },
        { label: "Version", value: api.version },
        { label: "Status", value: api.status }
      ]}
    >
      <ApiRegistryTable
        stats={[
          { label: "Standard", value: api.standard ?? "custom", tone: "accent" },
          { label: "Auth", value: api.auth_type },
          { label: "Status", value: api.status },
          { label: "Owner", value: api.owner_team ?? "unassigned" }
        ]}
      />
      <SectionCard title="API metadata" description="Registry-level metadata used by internal and external consumers.">
        <DataTable
          columns={["Field", "Value"]}
          rows={[
            ["Slug", api.slug],
            ["Base URL", api.base_url],
            ["Spec URL", api.spec_url ?? "—"],
            ["Auth type", api.auth_type],
            ["Owner team", api.owner_team ?? "—"],
            ["Status", <StatusPill key="api-status" label={api.status} tone={getStatusTone(api.status)} />],
            ["Created", formatDateTime(api.created_at)]
          ]}
        />
      </SectionCard>
    </ModulePage>
  );
}
