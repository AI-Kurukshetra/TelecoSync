import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { slaSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfSla } from "@/lib/integrations/tmf";

export async function GET() {
  try {
    const session = await requireSessionContext("operations:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("slas")
      .select("id, name, metric_type, target_value, measurement_window, penalty_json, created_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((sla) =>
        tmfSla({
          id: sla.id,
          name: sla.name,
          metricType: sla.metric_type,
          targetValue: sla.target_value,
          measurementWindow: sla.measurement_window,
          penalty: sla.penalty_json
        })
      )
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("operations:write");
    const json = await request.json().catch(() => null);
    const result = slaSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid SLA payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("slas")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          metric_type: result.data.metricType,
          target_value: result.data.targetValue ?? null,
          measurement_window: result.data.measurementWindow ?? null,
          penalty_json: result.data.penalty
        })
      )
      .select("id, name, metric_type, target_value, measurement_window")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create SLA.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "sla.created",
      entityType: "sla",
      entityId: data.id,
      payload: data
    });

    return created(
      tmfSla({
        id: data.id,
        name: data.name,
        metricType: data.metric_type,
        targetValue: data.target_value,
        measurementWindow: data.measurement_window
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
