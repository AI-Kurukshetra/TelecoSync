import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { alarmSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";

export async function GET() {
  try {
    const session = await requireSessionContext("operations:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("alarms")
      .select("id, network_element_id, severity, description, source, status, raised_at, cleared_at")
      .eq("tenant_id", session.tenantId)
      .order("raised_at", { ascending: false });

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("operations:write");
    const json = await request.json().catch(() => null);
    const result = alarmSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid alarm payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("alarms")
      .insert(
        withTenantScope(session, {
          network_element_id: result.data.networkElementId ?? null,
          severity: result.data.severity,
          description: result.data.description ?? null,
          source: result.data.source ?? null,
          status: result.data.status
        })
      )
      .select("id, network_element_id, severity, status, raised_at")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create alarm.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "alarm.raised",
      entityType: "alarm",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
