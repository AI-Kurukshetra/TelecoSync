import { created, ok } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { recordDomainEvent } from "@/lib/api/events";
import { handleRouteError } from "@/lib/api/route-guard";
import { requireSessionContext } from "@/lib/api/server-context";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { paginationMeta, parsePagination } from "@/lib/api/pagination";
import { tmfEnvelope, tmfHref } from "@/lib/integrations/tmf";
import { productSchema } from "@/lib/utils/zod-schemas/product";

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("billing:read");
    const pagination = parsePagination(request);
    const supabase = adminTenantClient();
    const { data, error, count } = await supabase
      .from("products")
      .select("id, name, description, category, price, currency, billing_cycle, lifecycle_status, version", {
        count: "exact"
      })
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    return ok(
      (data ?? []).map((product) =>
        tmfEnvelope("ProductOffering", {
          id: product.id,
          href: tmfHref("products", product.id),
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          currency: product.currency,
          billingCycle: product.billing_cycle,
          lifecycleStatus: product.lifecycle_status,
          version: product.version
        })
      ),
      paginationMeta(pagination, count)
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("billing:write");
    const json = await request.json().catch(() => null);
    const result = productSchema.safeParse(json);

    if (!result.success) {
      return apiError("VALIDATION_ERROR", "Invalid product payload.");
    }

    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from("products")
      .insert(
        withTenantScope(session, {
          name: result.data.name,
          description: result.data.description ?? null,
          category: result.data.category ?? null,
          price: result.data.price ?? null,
          currency: result.data.currency ?? "USD",
          billing_cycle: result.data.billingCycle ?? null,
          lifecycle_status: result.data.lifecycleStatus ?? "Active",
          version: result.data.version ?? "1.0"
        })
      )
      .select("id, name, description, category, price, currency, billing_cycle, lifecycle_status, version")
      .single();

    if (error || !data) {
      return apiError("INTERNAL_ERROR", error?.message ?? "Unable to create product.");
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
    });

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "product.created",
      entityType: "product",
      entityId: data.id,
      payload
    });

    return created(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
