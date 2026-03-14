import { adminTenantClient } from "@/lib/api/tenant-data";

type EventInput = {
  tenantId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  sourceService?: string;
};

export async function recordDomainEvent(input: EventInput) {
  const supabase = adminTenantClient();

  await supabase.from("event_log").insert({
    tenant_id: input.tenantId,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    payload_json: input.payload,
    source_service: input.sourceService ?? "web-api"
  });
}
