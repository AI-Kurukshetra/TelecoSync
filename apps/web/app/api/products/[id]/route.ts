import { ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";
import { productSchema } from "@/lib/utils/zod-schemas/product";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("billing:read");
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, category, price, currency, billing_cycle, lifecycle_status, version, valid_from, valid_to")
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Product not found.");
    }

    const payload = tmfEnvelope("ProductOffering", {
      id: data.id,
      href: tmfHref("products", data.id),
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      currency: data.currency,
      billingCycle: data.billing_cycle,
      lifecycleStatus: data.lifecycle_status,
      version: data.version
      ,
      validFrom: data.valid_from,
      validTo: data.valid_to
    });

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "product.updated",
      entityType: "product",
      entityId: data.id,
      payload
    });

    return ok(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSessionContext("billing:write");
    const json = await request.json().catch(() => null);
    const result = productSchema.partial().safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid product update payload.");
    }

    const updates: Record<string, unknown> = {};
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.description !== undefined) updates.description = result.data.description;
    if (result.data.category !== undefined) updates.category = result.data.category;
    if (result.data.price !== undefined) updates.price = result.data.price;
    if (result.data.currency !== undefined) updates.currency = result.data.currency;
    if (result.data.billingCycle !== undefined) updates.billing_cycle = result.data.billingCycle;
    if (result.data.lifecycleStatus !== undefined) updates.lifecycle_status = result.data.lifecycleStatus;
    if (result.data.version !== undefined) updates.version = result.data.version;

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("tenant_id", session.tenantId)
      .eq("id", params.id)
      .select("id, name, description, category, price, currency, billing_cycle, lifecycle_status, version, valid_from, valid_to")
      .maybeSingle();

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    if (!data) {
      return apiError("NOT_FOUND", "Product not found.");
    }

    return ok(
      tmfEnvelope("ProductOffering", {
        id: data.id,
        href: tmfHref("products", data.id),
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        currency: data.currency,
        billingCycle: data.billing_cycle,
        lifecycleStatus: data.lifecycle_status,
        version: data.version,
        validFrom: data.valid_from,
        validTo: data.valid_to
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
