import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, role_id, full_name, department, status, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "User not found.");
    return ok(
      tmfEnvelope("PartyRole", {
        id: data.id,
        href: tmfHref("admin/users", data.id),
        name: data.full_name,
        department: data.department,
        status: data.status,
        roleId: data.role_id,
        engagedParty: {
          id: data.id
        }
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
