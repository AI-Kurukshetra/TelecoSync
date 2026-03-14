import { created } from "@/lib/api/response";
import { apiError } from "@/lib/api/errors";
import { requireSessionContext } from "@/lib/api/server-context";
import { handleRouteError } from "@/lib/api/route-guard";
import { adminTenantClient, withTenantScope } from "@/lib/api/tenant-data";
import { parseCsv } from "@/lib/utils/csv";
import { recordDomainEvent } from "@/lib/api/events";

const importConfig = {
  customers: {
    table: "customers",
    transform(record: Record<string, string>) {
      return {
        account_number: record.account_number,
        first_name: record.first_name,
        last_name: record.last_name,
        email: record.email,
        phone: record.phone || null,
        status: record.status || "active"
      };
    }
  },
  products: {
    table: "products",
    transform(record: Record<string, string>) {
      return {
        name: record.name,
        description: record.description || null,
        category: record.category || null,
        price: record.price ? Number(record.price) : null,
        currency: record.currency || "USD",
        billing_cycle: record.billing_cycle || null,
        lifecycle_status: record.lifecycle_status || "Active",
        version: record.version || "1.0"
      };
    }
  },
  network_elements: {
    table: "network_elements",
    transform(record: Record<string, string>) {
      return {
        name: record.name,
        type: record.type,
        vendor_id: record.vendor_id || null,
        model: record.model || null,
        serial_number: record.serial_number || null,
        ip_address: record.ip_address || null,
        status: record.status || "active"
      };
    }
  }
} as const;

export async function POST(request: Request) {
  try {
    const session = await requireSessionContext("admin:write");
    const contentType = request.headers.get("content-type") ?? "";
    let resource: keyof typeof importConfig | null = null;
    let csv = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      resource = String(formData.get("resource") ?? "") as keyof typeof importConfig;
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return apiError("VALIDATION_ERROR", "CSV file is required.");
      }

      csv = await file.text();
    } else {
      const json = (await request.json().catch(() => null)) as
        | { resource?: string; csv?: string }
        | null;
      resource = (json?.resource ?? "") as keyof typeof importConfig;
      csv = json?.csv ?? "";
    }

    if (!resource || !(resource in importConfig) || csv.trim().length === 0) {
      return apiError("VALIDATION_ERROR", "Invalid import payload.");
    }

    const records = parseCsv(csv);
    if (records.length === 0) {
      return apiError("VALIDATION_ERROR", "CSV does not contain any rows.");
    }

    const config = importConfig[resource];
    const payload = records.map((record) =>
      withTenantScope(session, config.transform(record))
    );

    const supabase = adminTenantClient();
    const { error } = await supabase.from(config.table).insert(payload);

    if (error) {
      return apiError("INTERNAL_ERROR", error.message);
    }

    await recordDomainEvent({
      tenantId: session.tenantId,
      eventType: "import.completed",
      entityType: resource,
      entityId: session.userId,
      payload: {
        resource,
        rowCount: payload.length
      }
    });

    return created({
      resource,
      imported: payload.length
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
