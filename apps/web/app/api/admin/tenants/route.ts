import { ok, created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tenantSchema } from "@/lib/utils/zod-schemas/admin";
import { recordDomainEvent } from "@/lib/api/events";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";

export async function GET() {
  try {
    const session = await requireSessionContext("admin:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("id, name, slug, plan, status, config_json, created_at")
      .eq("id", session.tenantId)
      .order("created_at", { ascending: false });

    if (error) return apiError("INTERNAL_ERROR", error.message);
    return ok(
      (data ?? []).map((tenant) =>
        tmfEnvelope("Organization", {
          id: tenant.id,
          href: tmfHref("admin/tenants", tenant.id),
          name: tenant.name,
          organizationType: "tenant",
          status: tenant.status,
          plan: tenant.plan,
          externalReference: tenant.slug
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
    const result = tenantSchema.safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid tenant payload.");

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("tenants")
      .insert({
        name: result.data.name,
        slug: result.data.slug,
        plan: result.data.plan,
        status: result.data.status
      })
      .select("id, name, slug, plan, status")
      .single();

    if (error || !data) return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create tenant.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "tenant.created",
      entityType: "tenant",
      entityId: data.id,
      payload: data
    });

    return created(
      tmfEnvelope("Organization", {
        id: data.id,
        href: tmfHref("admin/tenants", data.id),
        name: data.name,
        organizationType: "tenant",
        status: data.status,
        plan: data.plan,
        externalReference: data.slug
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
