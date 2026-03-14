import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient } from "@/lib/api/tenant-data";
import { toCsv } from "@/lib/utils/csv";
import { recordDomainEvent } from "@/lib/api/events";

const exportConfig = {
  customers: {
    table: "customers",
    columns: [
      "account_number",
      "first_name",
      "last_name",
      "email",
      "phone",
      "status"
    ]
  },
  products: {
    table: "products",
    columns: [
      "name",
      "description",
      "category",
      "price",
      "currency",
      "billing_cycle",
      "lifecycle_status",
      "version"
    ]
  },
  orders: {
    table: "orders",
    columns: [
      "order_number",
      "customer_id",
      "account_id",
      "order_type",
      "status",
      "total_amount",
      "currency"
    ]
  },
  invoices: {
    table: "invoices",
    columns: [
      "invoice_number",
      "account_id",
      "billing_period_start",
      "billing_period_end",
      "subtotal",
      "tax",
      "total",
      "status"
    ]
  },
  network_elements: {
    table: "network_elements",
    columns: [
      "name",
      "type",
      "vendor_id",
      "model",
      "serial_number",
      "ip_address",
      "status"
    ]
  }
} as const;

export async function GET(request: Request) {
  try {
    const session = await requireSessionContext("admin:read");
    const url = new URL(request.url);
    const resource = url.searchParams.get("resource") as keyof typeof exportConfig | null;

    if (!resource || !(resource in exportConfig)) {
      return apiError("VALIDATION_ERROR", "Unknown export resource.");
    }

    const config = exportConfig[resource];
    const supabase = adminTenantClient();
    const { data, error } = await supabase
      .from(config.table)
      .select(config.columns.join(","))
      .eq("tenant_id", session.tenantId)
      .limit(5000);

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    const csv = toCsv(
      ((data ?? []) as unknown) as Record<string, unknown>[],
      config.columns
    );

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "export.generated",
      entityType: resource,
      entityId: session.userId,
      payload: {
        resource,
        rowCount: data?.length ?? 0
      }
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${resource}.csv"`
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
