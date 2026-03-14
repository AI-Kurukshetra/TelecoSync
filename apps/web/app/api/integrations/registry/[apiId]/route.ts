import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET(
  _request: Request,
  { params }: { params: { apiId: string } }
) {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("api_registry")
      .select("id, name, slug, version, standard, base_url, spec_url, auth_type, status, owner_team, created_at")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.apiId)
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "API registry entry not found.");
    return ok(
      tmfEnvelope("ApiSpecification", {
        id: data.id,
        href: tmfHref("admin/integrations/registry", data.id),
        name: data.name,
        version: data.version,
        lifecycleStatus: data.status,
        standard: data.standard,
        url: data.base_url,
        specUrl: data.spec_url,
        authType: data.auth_type,
        ownerTeam: data.owner_team
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
