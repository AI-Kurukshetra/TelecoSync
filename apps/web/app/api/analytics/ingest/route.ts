import { created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AnalyticsIngestPayload = {
  tenantId?: string;
  metricType?: string;
  value?: number;
  unit?: string;
};

export async function POST(request: Request) {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const providedSecret =
    request.headers.get("x-internal-api-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (internalSecret && providedSecret !== internalSecret) {
    return apiError("FORBIDDEN", "Invalid analytics ingest secret.");
  }

  const body = (await request.json().catch(() => null)) as AnalyticsIngestPayload | null;

  if (
    !body?.tenantId ||
    !body.metricType ||
    typeof body.value !== "number" ||
    Number.isNaN(body.value)
  ) {
    return apiError("VALIDATION_ERROR", "Invalid analytics ingest payload.");
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("performance_metrics")
    .insert({
      tenant_id: body.tenantId,
      metric_type: body.metricType,
      value: body.value,
      unit: body.unit ?? "ms"
    })
    .select("id, metric_type, value, unit, recorded_at")
    .single();

  if (error || !data) {
    return apiError("INTERNAL_ERROR", error?.message ?? "Unable to ingest analytics metric.");
  }

  return created(data);
}
