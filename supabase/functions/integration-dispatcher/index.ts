import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const qstashUrl = Deno.env.get("QSTASH_URL");
const qstashToken = Deno.env.get("QSTASH_TOKEN");
const retryDelaySeconds = Number(Deno.env.get("QSTASH_RETRY_DELAY_SECONDS") ?? "30");
const maxRetryCount = 3;

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function deliverWebhook(subscription: {
  id: string;
  target_url: string;
  secret: string;
  headers_json: Record<string, string> | null;
}, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  const signature = await signPayload(body, subscription.secret);
  const response = await fetch(subscription.target_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-telecosync-signature": signature,
      ...(subscription.headers_json ?? {})
    },
    body
  });

  return {
    httpStatus: response.status,
    responseBody: await response.text(),
    status: response.ok ? "success" : "failed"
  };
}

async function executeConnector(connector: {
  id: string;
  connector_type: string;
  direction: string;
  config_json: Record<string, unknown> | null;
}, payload: Record<string, unknown>) {
  const executionInsert = await supabase
    .from("connector_executions")
    .insert({
      tenant_id: payload.tenant_id,
      connector_id: connector.id,
      trigger_type: "event",
      status: "running",
      request_json: payload
    })
    .select("id")
    .single();

  if (executionInsert.error || !executionInsert.data) {
    throw new Error(executionInsert.error?.message ?? "Unable to create connector execution.");
  }

  const endpoint =
    typeof connector.config_json?.endpoint === "string"
      ? connector.config_json.endpoint
      : typeof connector.config_json?.url === "string"
        ? connector.config_json.url
        : typeof connector.config_json?.baseUrl === "string"
          ? connector.config_json.baseUrl
        : null;
  const method =
    typeof connector.config_json?.method === "string"
      ? connector.config_json.method.toUpperCase()
      : "POST";
  const headers =
    connector.config_json?.headers &&
    typeof connector.config_json.headers === "object" &&
    !Array.isArray(connector.config_json.headers)
      ? (connector.config_json.headers as Record<string, string>)
      : {};
  const authHeader =
    typeof connector.config_json?.apiKey === "string"
      ? { Authorization: `Bearer ${connector.config_json.apiKey}` }
      : {};

  let status = "queued";
  let responseJson: Record<string, unknown> = { queued: true };
  let errorMessage: string | null = null;

  if (
    ["rest", "custom"].includes(connector.connector_type) &&
    connector.direction !== "inbound" &&
    endpoint
  ) {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
          ...authHeader
        },
        body: JSON.stringify(payload)
      });

      status = response.ok ? "success" : "failed";
      responseJson = {
        status: response.status,
        body: await response.text()
      };
      errorMessage = response.ok ? null : `REST connector failed with status ${response.status}.`;
    } catch (error) {
      status = "failed";
      errorMessage = error instanceof Error ? error.message : "REST connector failed.";
    }
  } else if (
    connector.connector_type === "sftp" &&
    connector.direction !== "inbound"
  ) {
    status = "success";
    responseJson = {
      queued: true,
      transport: "sftp",
      host:
        typeof connector.config_json?.host === "string"
          ? connector.config_json.host
          : null,
      remotePath:
        typeof connector.config_json?.remotePath === "string"
          ? connector.config_json.remotePath
          : null
    };
  } else if (
    connector.connector_type === "payment-gateway" ||
    connector.config_json?.systemType === "payment"
  ) {
    try {
      const response = await fetch(endpoint ?? "", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader
        },
        body: JSON.stringify(payload)
      });

      status = response.ok ? "success" : "failed";
      responseJson = {
        status: response.status,
        gateway: true,
        body: await response.text()
      };
      errorMessage = response.ok ? null : `Payment connector failed with status ${response.status}.`;
    } catch (error) {
      status = "failed";
      errorMessage = error instanceof Error ? error.message : "Payment connector failed.";
    }
  }

  await supabase
    .from("connector_executions")
    .update({
      status,
      response_json: responseJson,
      error_message: errorMessage,
      completed_at: new Date().toISOString()
    })
    .eq("id", executionInsert.data.id);

  await supabase
    .from("integration_connectors")
    .update({
      last_run_at: new Date().toISOString(),
      last_run_status: status
    })
    .eq("id", connector.id);

  return {
    status,
    executionId: executionInsert.data.id
  };
}

async function enqueueRetry(input: {
  eventId: string;
  retryCount: number;
  subscriptionIds: string[];
  connectorIds: string[];
}) {
  if (!qstashUrl || !qstashToken) {
    return false;
  }

  const functionBaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  if (!functionBaseUrl) {
    return false;
  }

  const target = `${functionBaseUrl}/functions/v1/integration-dispatcher`;
  const response = await fetch(
    `${qstashUrl}/v2/publish/${encodeURIComponent(target)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${qstashToken}`,
        "Content-Type": "application/json",
        "Upstash-Delay": `${retryDelaySeconds}s`
      },
      body: JSON.stringify(input)
    }
  );

  return response.ok;
}

Deno.serve(async (request) => {
  const body = await request.json().catch(() => ({}));
  const eventId = body.eventId as string | undefined;
  const retryCount = Number(body.retryCount ?? 0);
  const retrySubscriptionIds = Array.isArray(body.subscriptionIds)
    ? (body.subscriptionIds as string[])
    : [];
  const retryConnectorIds = Array.isArray(body.connectorIds)
    ? (body.connectorIds as string[])
    : [];

  if (!eventId) {
    return Response.json({ error: "eventId is required." }, { status: 400 });
  }

  const { data: event, error: eventError } = await supabase
    .from("event_log")
    .select("id, tenant_id, event_type, entity_type, entity_id, payload_json")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    return Response.json({ error: eventError?.message ?? "Event not found." }, { status: 404 });
  }

  const [{ data: subscriptions = [] }, { data: connectors = [] }] = await Promise.all([
    supabase
      .from("webhook_subscriptions")
      .select("id, target_url, secret, event_types, headers_json")
      .eq("tenant_id", event.tenant_id)
      .eq("enabled", true),
    supabase
      .from("integration_connectors")
      .select("id, connector_type, direction, config_json, enabled")
      .eq("tenant_id", event.tenant_id)
      .eq("enabled", true)
  ]);

  const matchingSubscriptions = subscriptions.filter((subscription) =>
    (subscription.event_types as string[]).includes(event.event_type)
  );
  const filteredSubscriptions =
    retrySubscriptionIds.length > 0
      ? matchingSubscriptions.filter((subscription) =>
          retrySubscriptionIds.includes(subscription.id)
        )
      : matchingSubscriptions;
  const filteredConnectors =
    retryConnectorIds.length > 0
      ? connectors.filter((connector) => retryConnectorIds.includes(connector.id))
      : connectors;

  const deliveryResults = [];
  const failedSubscriptionIds: string[] = [];
  for (const subscription of filteredSubscriptions) {
    const delivery = await deliverWebhook(
      subscription as {
        id: string;
        target_url: string;
        secret: string;
        headers_json: Record<string, string> | null;
      },
      event.payload_json as Record<string, unknown>
    );

    deliveryResults.push(
      await supabase.from("webhook_deliveries").insert({
        tenant_id: event.tenant_id,
        subscription_id: subscription.id,
        event_type: event.event_type,
        payload_json: event.payload_json,
        http_status: delivery.httpStatus,
        response_body: delivery.responseBody,
        attempt_number: retryCount + 1,
        status: delivery.status
      })
    );

    if (delivery.status !== "success") {
      failedSubscriptionIds.push(subscription.id);
    }
  }

  const failedConnectorIds: string[] = [];
  for (const connector of filteredConnectors) {
    const execution = await executeConnector(
      connector as {
        id: string;
        connector_type: string;
        direction: string;
        config_json: Record<string, unknown> | null;
      },
      {
        tenant_id: event.tenant_id,
        event_type: event.event_type,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        payload: event.payload_json
      }
    );

    if (execution.status !== "success") {
      failedConnectorIds.push(connector.id);
    }
  }

  const queuedRetry =
    retryCount < maxRetryCount &&
    (failedSubscriptionIds.length > 0 || failedConnectorIds.length > 0)
      ? await enqueueRetry({
          eventId,
          retryCount: retryCount + 1,
          subscriptionIds: failedSubscriptionIds,
          connectorIds: failedConnectorIds
        })
      : false;

  await supabase
    .from("event_log")
    .update({
      processed:
        failedSubscriptionIds.length === 0 &&
        failedConnectorIds.length === 0,
      processed_at:
        failedSubscriptionIds.length === 0 &&
        failedConnectorIds.length === 0
          ? new Date().toISOString()
          : null
    })
    .eq("id", eventId);

  return Response.json({
    processed:
      failedSubscriptionIds.length === 0 &&
      failedConnectorIds.length === 0,
    deliveries: deliveryResults.length,
    connectors: filteredConnectors.length,
    retryCount,
    queuedRetry,
    failedSubscriptions: failedSubscriptionIds.length,
    failedConnectors: failedConnectorIds.length
  });
});
