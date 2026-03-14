import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { tmfEvent } from "@/lib/integrations/tmf";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("admin:read");
    const pagination = parsePagination(request, {
      defaultLimit: 50,
      maxLimit: 200
    });
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("event_log")
      .select("id, event_type, entity_type, entity_id, payload_json, source_service, fired_at, processed, processed_at", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("fired_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((event) =>
        tmfEvent({
          id: event.id,
          eventType: event.event_type,
          entityType: event.entity_type,
          entityId: event.entity_id,
          sourceService: event.source_service,
          firedAt: event.fired_at,
          processed: event.processed,
          payload: event.payload_json
        })
      ),
      paginationMeta(pagination, count)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
