import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { apiRegistrySchema } from "@/lib/utils/zod-schemas/integration";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET() {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("api_registry")
      .select("id, name, slug, version, standard, base_url, spec_url, auth_type, status, owner_team, created_at")
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false });

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((api) =>
        tmfEnvelope("ApiSpecification", {
          id: api.id,
          href: tmfHref("admin/integrations/registry", api.id),
          name: api.name,
          version: api.version,
          lifecycleStatus: api.status,
          standard: api.standard,
          url: api.base_url,
          specUrl: api.spec_url,
          authType: api.auth_type
        })
      )
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("admin:write");
    const json = await request.json().catch(() => null);
    const result = apiRegistrySchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid API registry payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("api_registry")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          slug: result.data.slug,
          version: result.data.version,
          standard: result.data.standard ?? null,
          base_url: result.data.baseUrl,
          spec_url: result.data.specUrl ?? null,
          auth_type: result.data.authType,
          status: result.data.status,
          owner_team: result.data.ownerTeam ?? null
        })
      )
      .select("id, name, slug, version, standard, status")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create registry entry.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "api_registry.created",
      entityType: "api_registry",
      entityId: data.id,
      payload: data
    });

    return created(
      tmfEnvelope("ApiSpecification", {
        id: data.id,
        href: tmfHref("admin/integrations/registry", data.id),
        name: data.name,
        version: data.version,
        lifecycleStatus: data.status,
        standard: data.standard
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
