import { z } from "zod";
import { created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const inboundEventSchema = z.object({
  tenantId: z.string().uuid(),
  eventType: z.string().min(3),
  entityType: z.string().min(2),
  entityId: z.string().uuid(),
  payload: z.record(z.unknown()).default({}),
  sourceService: z.string().min(2).default("external-webhook")
});

export async function POST(request: Request) {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const providedSecret =
    request.headers.get("x-internal-api-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (internalSecret && providedSecret !== internalSecret) {
    return apiError("FORBIDDEN", "Invalid inbound webhook secret.");
  }

  const body = await request.json().catch(() => null);
  const parsed = inboundEventSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid inbound webhook payload.");
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("event_log")
    .insert({
      tenant_id: parsed.data.tenantId,
      event_type: parsed.data.eventType,
      entity_type: parsed.data.entityType,
      entity_id: parsed.data.entityId,
      payload_json: parsed.data.payload,
      source_service: parsed.data.sourceService,
      processed: false
    })
    .select("id, event_type, entity_type, entity_id, fired_at, processed")
    .single();

  if (error || !data) {
    return apiError("INTERNAL_ERROR", error?.message ?? "Unable to persist inbound event.");
  }

  return created(data);
}
