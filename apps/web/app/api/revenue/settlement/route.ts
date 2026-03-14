import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { z } from "zod";
import { recordDomainEvent } from "@/lib/api/events";

const settlementSchema = z.object({
  partnerId: z.string().uuid(),
  partnerType: z.string().min(2),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  direction: z.enum(["payable", "receivable"]),
  grossAmount: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  netAmount: z.number().nonnegative().optional(),
  dueDate: z.string().optional()
});

export async function GET() {
  try {
    const session = await requireSessionContext("revenue:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("settlement_statements")
      .select("id, partner_id, partner_type, period_start, period_end, direction, gross_amount, tax_amount, net_amount, currency, status, due_date, paid_at, created_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("revenue:write");
    const json = await request.json().catch(() => null);
    const result = settlementSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid settlement payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("settlement_statements")
      .insert(
        withTenantScope(session, {
          partner_id: result.data.partnerId,
          partner_type: result.data.partnerType,
          period_start: result.data.periodStart,
          period_end: result.data.periodEnd,
          direction: result.data.direction,
          gross_amount: result.data.grossAmount ?? null,
          tax_amount: result.data.taxAmount ?? null,
          net_amount: result.data.netAmount ?? null,
          due_date: result.data.dueDate ?? null
        })
      )
      .select("id, partner_id, partner_type, direction, net_amount, status")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create settlement statement.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "settlement.created",
      entityType: "settlement_statement",
      entityId: data.id,
      payload: data
    });

    return created(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
