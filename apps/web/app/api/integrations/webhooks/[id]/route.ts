import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("webhook_subscriptions")
      .select("id, name, target_url, event_types, headers_json, enabled, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Webhook subscription not found.");
    return ok(
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
