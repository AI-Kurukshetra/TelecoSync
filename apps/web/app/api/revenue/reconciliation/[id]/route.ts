import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { recordDomainEvent } from "@/lib/api/events";
import { z } from "zod";

const reconciliationUpdateSchema = z.object({
  status: z.string().optional(),
  grossRevenue: z.number().optional(),
  adjustments: z.number().optional(),
  notes: z.string().optional(),
  approve: z.boolean().optional()
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("revenue:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("reconciliation_runs")
      .select("id, period_start, period_end, status, gross_revenue, adjustments, net_revenue, approved_by, approved_at, notes")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Reconciliation run not found.");
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("revenue:write");
    const json = await request.json().catch(() => null);
    const result = reconciliationUpdateSchema.safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid reconciliation update payload.");
    }

    const updates: Record<string, unknown> = {};
    if (result.data.status !== undefined) updates.status = result.data.status;
    if (result.data.grossRevenue !== undefined) updates.gross_revenue = result.data.grossRevenue;
    if (result.data.adjustments !== undefined) updates.adjustments = result.data.adjustments;
    if (result.data.notes !== undefined) updates.notes = result.data.notes;
    if (result.data.approve) {
      updates.status = "approved";
      updates.approved_by = session.userId;
      updates.approved_at = new Date().toISOString();
    }

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("reconciliation_runs")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, period_start, period_end, status, gross_revenue, adjustments, net_revenue, approved_by, approved_at, notes")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Reconciliation run not found.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: result.data.approve ? "reconciliation.approved" : "reconciliation.updated",
      entityType: "reconciliation_run",
      entityId: data.id,
      payload: data
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
