import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("orders:write");
    const body = (await request.json().catch(() => null)) as { status?: string } | null;

    if (!body?.status) {
      return apiError("VALIDATION_ERROR", "Status is required.");
    }

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: body.status,
        fulfilled_at: body.status === "completed" ? new Date().toISOString() : null
      })
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, status, fulfilled_at")
      .maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Order not found.");
    }

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "order.status.changed",
      entityType: "order",
      entityId: data.id,
      payload: {
        id: data.id,
        status: data.status,
        fulfilledAt: data.fulfilled_at
      }
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
