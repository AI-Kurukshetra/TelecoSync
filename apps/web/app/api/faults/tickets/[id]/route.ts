import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfTroubleTicket } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("trouble_tickets")
      .select("id, ticket_number, title, description, severity, status, assigned_to, network_element_id, service_instance_id, created_at, resolved_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Trouble ticket not found.");
    return ok(
      tmfTroubleTicket({
        id: data.id,
        ticketNumber: data.ticket_number,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
