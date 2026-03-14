import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { assetSchema } from "@/lib/utils/zod-schemas/oss";
import { recordDomainEvent } from "@/lib/api/events";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:write");
    const json = await request.json().catch(() => null);
    const result = assetSchema.partial().safeParse(json);
    if (!result.success) return apiError("VALIDATION_ERROR", "Invalid asset update payload.");

    const updates: Record<string, unknown> = {};
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.assetType !== undefined) updates.asset_type = result.data.assetType;
    if (result.data.status !== undefined) updates.status = result.data.status;
    if (result.data.locationId !== undefined) updates.location_id = result.data.locationId;
    if (result.data.assignedTo !== undefined) updates.assigned_to = result.data.assignedTo;
    if (result.data.metadata !== undefined) updates.metadata_json = result.data.metadata;

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, name, asset_type, status, location_id, assigned_to, metadata_json")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Asset not found.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "asset.updated",
      entityType: "asset",
      entityId: data.id,
      payload: data
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("operations:write");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("assets")
      .delete()
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id")
      .maybeSingle();

    if (error) return apiError("INTERNAL_ERROR", error.message);
    if (!data) return apiError("NOT_FOUND", "Asset not found.");

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "asset.deleted",
      entityType: "asset",
      entityId: data.id,
      payload: { id: data.id }
    });

    return ok({ id: data.id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
