import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { recordDomainEvent } from "@/lib/api/events";
import { z } from "zod";

const settlementUpdateSchema = z.object({
  status: z.string().optional(),
  dueDate: z.string().optional(),
  paid: z.boolean().optional(),
  paidAt: z.string().datetime().optional()
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("revenue:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("settlement_statements")
      .select("id, partner_id, partner_type, period_start, period_end, direction, gross_amount, tax_amount, net_amount, currency, status, due_date, paid_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Settlement statement not found.");
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
    const result = settlementUpdateSchema.safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid settlement update payload.");
    }

    const updates: Record<string, unknown> = {};
    if (result.data.status !== undefined) updates.status = result.data.status;
    if (result.data.dueDate !== undefined) updates.due_date = result.data.dueDate;
    if (result.data.paidAt !== undefined) updates.paid_at = result.data.paidAt;
    if (result.data.paid) {
      updates.status = "paid";
      updates.paid_at = result.data.paidAt ?? new Date().toISOString();
    }

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("settlement_statements")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, partner_id, partner_type, period_start, period_end, direction, gross_amount, tax_amount, net_amount, currency, status, due_date, paid_at")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Settlement statement not found.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: result.data.paid ? "settlement.paid" : "settlement.updated",
      entityType: "settlement_statement",
      entityId: data.id,
      payload: data
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
