import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { webhookSubscriptionSchema } from "@/lib/utils/zod-schemas/integration";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("admin:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("webhook_subscriptions")
      .select("id, name, target_url, event_types, headers_json, enabled, created_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((webhook) =>
        tmfEnvelope("EventSubscription", {
          id: webhook.id,
          href: tmfHref("admin/integrations/webhooks", webhook.id),
          name: webhook.name,
          callback: webhook.target_url,
          eventTypes: webhook.event_types,
          enabled: webhook.enabled,
          headers: webhook.headers_json
        })
      ),
      paginationMeta(pagination, count)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("admin:write");
    const json = await request.json().catch(() => null);
    const result = webhookSubscriptionSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid webhook payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("webhook_subscriptions")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          target_url: result.data.targetUrl,
          secret: result.data.secret ?? crypto.randomUUID().replace(/-/g, ""),
          event_types: result.data.eventTypes,
          headers_json: result.data.headers ?? {},
          enabled: result.data.enabled ?? true
        })
      )
      .select("id, name, target_url, event_types, headers_json, enabled")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create webhook subscription.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "webhook.created",
      entityType: "webhook_subscription",
      entityId: data.id,
      payload: data
    });

    return created(
      tmfEnvelope("EventSubscription", {
        id: data.id,
        href: tmfHref("admin/integrations/webhooks", data.id),
        name: data.name,
        callback: data.target_url,
        eventTypes: data.event_types,
        enabled: data.enabled,
        headers: data.headers_json
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
