import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, nextSequence, withTenantScope } from "@/lib/api/tenant-data";
import { ticketSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfTroubleTicket } from "@/lib/integrations/tmf";

export async function GET() {
  try {
    const session = await requireSessionContext("operations:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("trouble_tickets")
      .select("id, ticket_number, title, description, severity, status, assigned_to, network_element_id, service_instance_id, created_at, resolved_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((ticket) =>
        tmfTroubleTicket({
          id: ticket.id,
          ticketNumber: ticket.ticket_number,
          title: ticket.title,
          description: ticket.description,
          severity: ticket.severity,
          status: ticket.status,
          createdAt: ticket.created_at,
          resolvedAt: ticket.resolved_at
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
    const result = ticketSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid ticket payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("trouble_tickets")
      .insert(
        withTenantScope(session, {
          ticket_number: nextSequence("TT"),
          title: result.data.title,
          description: result.data.description ?? null,
          severity: result.data.severity,
          status: "open",
          network_element_id: result.data.networkElementId ?? null,
          service_instance_id: result.data.serviceInstanceId ?? null
        })
      )
      .select("id, ticket_number, title, severity, status")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create trouble ticket.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "ticket.created",
      entityType: "trouble_ticket",
      entityId: data.id,
      payload: data
    });

    return created(
      tmfTroubleTicket({
        id: data.id,
        ticketNumber: data.ticket_number,
        title: data.title,
        severity: data.severity,
        status: data.status
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
