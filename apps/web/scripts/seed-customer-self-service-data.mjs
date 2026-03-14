import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = value;
    index += 1;
  }
  return args;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function seedId(tenantId, scope) {
  const hex = createHash("sha1")
    .update(`${tenantId}:${scope}`)
    .digest("hex")
    .slice(0, 32);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function upsertRows(supabase, table, rows) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from(table).upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

async function main() {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
  loadEnvFile(path.join(repoRoot, ".env.local"));
  loadEnvFile(path.join(repoRoot, "apps/web/.env.local"));

  const args = parseArgs(process.argv.slice(2));
  const tenantId = args["tenant-id"];
  const customerId = args["customer-id"];
  const accountId = args["account-id"];
  const userId = args["user-id"];

  if (!tenantId || !customerId || !accountId || !userId) {
    throw new Error("Missing required arguments --tenant-id --customer-id --account-id --user-id");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantError) {
    throw new Error(`tenants: ${tenantError.message}`);
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) {
    throw new Error(`customers: ${customerError.message}`);
  }

  if (!tenant || !customer) {
    throw new Error("Tenant or customer not found.");
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, currency")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (productsError) {
    throw new Error(`products: ${productsError.message}`);
  }

  const { data: elements, error: elementsError } = await supabase
    .from("network_elements")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (elementsError) {
    throw new Error(`network_elements: ${elementsError.message}`);
  }

  if (!products || products.length < 2) {
    throw new Error("At least two tenant products are required.");
  }

  if (!elements || elements.length === 0) {
    throw new Error("At least one tenant network element is required.");
  }

  const primaryProduct = products[0];
  const secondaryProduct = products[1];
  const primaryElement = elements[0];
  const secondaryElement = elements[1] ?? elements[0];

  const ids = {
    serviceActive: seedId(tenantId, `self-service:${customerId}:service:active`),
    servicePending: seedId(tenantId, `self-service:${customerId}:service:pending`),
    orderCompleted: seedId(tenantId, `self-service:${customerId}:order:completed`),
    orderPending: seedId(tenantId, `self-service:${customerId}:order:pending`),
    invoicePaid: seedId(tenantId, `self-service:${customerId}:invoice:paid`),
    invoiceIssued: seedId(tenantId, `self-service:${customerId}:invoice:issued`),
    paymentPaid: seedId(tenantId, `self-service:${customerId}:payment:paid`),
    usagePrimary: seedId(tenantId, `self-service:${customerId}:usage:primary`),
    usageSecondary: seedId(tenantId, `self-service:${customerId}:usage:secondary`),
    documentWelcome: seedId(tenantId, `self-service:${customerId}:document:welcome`),
    documentInvoice: seedId(tenantId, `self-service:${customerId}:document:invoice`),
    notificationInvoice: seedId(tenantId, `self-service:${customerId}:notification:invoice`),
    notificationAlert: seedId(tenantId, `self-service:${customerId}:notification:alert`),
  };

  const slugPrefix = (tenant.slug ?? "tenant").toUpperCase();

  await upsertRows(supabase, "service_instances", [
    {
      id: ids.serviceActive,
      tenant_id: tenantId,
      customer_id: customerId,
      product_id: primaryProduct.id,
      network_element_id: primaryElement.id,
      status: "active",
      activated_at: "2026-03-10T10:00:00+05:30",
      config_json: {
        source: "self_service_seed",
        label: "Primary business service",
      },
    },
    {
      id: ids.servicePending,
      tenant_id: tenantId,
      customer_id: customerId,
      product_id: secondaryProduct.id,
      network_element_id: secondaryElement.id,
      status: "pending",
      config_json: {
        source: "self_service_seed",
        label: "Pending add-on service",
      },
    },
  ]);

  await upsertRows(supabase, "orders", [
    {
      id: ids.orderCompleted,
      tenant_id: tenantId,
      customer_id: customerId,
      account_id: accountId,
      order_number: `${slugPrefix}-CUS-ORD-1001`,
      order_type: "new_install",
      status: "completed",
      items_json: [
        {
          productId: primaryProduct.id,
          productName: primaryProduct.name,
          quantity: 1,
          channel: "customer_portal",
        },
      ],
      total_amount: primaryProduct.price ?? 0,
      currency: primaryProduct.currency ?? "USD",
      fulfilled_at: "2026-03-10T14:45:00+05:30",
    },
    {
      id: ids.orderPending,
      tenant_id: tenantId,
      customer_id: customerId,
      account_id: accountId,
      order_number: `${slugPrefix}-CUS-ORD-1002`,
      order_type: "addon",
      status: "in_progress",
      items_json: [
        {
          productId: secondaryProduct.id,
          productName: secondaryProduct.name,
          quantity: 1,
          channel: "customer_portal",
        },
      ],
      total_amount: secondaryProduct.price ?? 0,
      currency: secondaryProduct.currency ?? "USD",
    },
  ]);

  await upsertRows(supabase, "invoices", [
    {
      id: ids.invoicePaid,
      tenant_id: tenantId,
      account_id: accountId,
      invoice_number: `${slugPrefix}-CUS-INV-1001`,
      billing_period_start: "2026-03-01T00:00:00+05:30",
      billing_period_end: "2026-03-31T23:59:59+05:30",
      subtotal: primaryProduct.price ?? 0,
      tax: Math.round((Number(primaryProduct.price ?? 0) * 0.18) * 100) / 100,
      total: Math.round((Number(primaryProduct.price ?? 0) * 1.18) * 100) / 100,
      status: "paid",
      due_date: "2026-04-10",
      paid_at: "2026-04-05T11:20:00+05:30",
    },
    {
      id: ids.invoiceIssued,
      tenant_id: tenantId,
      account_id: accountId,
      invoice_number: `${slugPrefix}-CUS-INV-1002`,
      billing_period_start: "2026-04-01T00:00:00+05:30",
      billing_period_end: "2026-04-30T23:59:59+05:30",
      subtotal: secondaryProduct.price ?? 0,
      tax: Math.round((Number(secondaryProduct.price ?? 0) * 0.18) * 100) / 100,
      total: Math.round((Number(secondaryProduct.price ?? 0) * 1.18) * 100) / 100,
      status: "issued",
      due_date: "2026-05-10",
    },
  ]);

  await upsertRows(supabase, "payments", [
    {
      id: ids.paymentPaid,
      tenant_id: tenantId,
      invoice_id: ids.invoicePaid,
      amount: Math.round((Number(primaryProduct.price ?? 0) * 1.18) * 100) / 100,
      currency: primaryProduct.currency ?? "USD",
      method: "upi",
      status: "captured",
      gateway_reference: `${slugPrefix}-PAY-1001`,
      paid_at: "2026-04-05T11:20:00+05:30",
    },
  ]);

  await upsertRows(supabase, "usage_records", [
    {
      id: ids.usagePrimary,
      tenant_id: tenantId,
      account_id: accountId,
      service_instance_id: ids.serviceActive,
      usage_type: "monthly_service_commitment",
      quantity: 1,
      unit: "service",
      rated_amount: primaryProduct.price ?? 0,
      recorded_at: "2026-03-31T23:00:00+05:30",
    },
    {
      id: ids.usageSecondary,
      tenant_id: tenantId,
      account_id: accountId,
      service_instance_id: ids.servicePending,
      usage_type: "pending_addon_reservation",
      quantity: 1,
      unit: "service",
      rated_amount: secondaryProduct.price ?? 0,
      recorded_at: "2026-04-14T09:00:00+05:30",
    },
  ]);

  await upsertRows(supabase, "documents", [
    {
      id: ids.documentWelcome,
      tenant_id: tenantId,
      entity_type: "customer",
      entity_id: customerId,
      name: `${customer.first_name ?? "Customer"}-welcome-pack.pdf`,
      storage_path: `${tenantId}/self-service/${customerId}/welcome-pack.pdf`,
      mime_type: "application/pdf",
      size_bytes: 182400,
      uploaded_by: userId,
    },
    {
      id: ids.documentInvoice,
      tenant_id: tenantId,
      entity_type: "customer",
      entity_id: customerId,
      name: `${customer.first_name ?? "Customer"}-billing-summary-april.pdf`,
      storage_path: `${tenantId}/self-service/${customerId}/billing-summary-april.pdf`,
      mime_type: "application/pdf",
      size_bytes: 146220,
      uploaded_by: userId,
    },
  ]);

  await upsertRows(supabase, "notifications", [
    {
      id: ids.notificationInvoice,
      tenant_id: tenantId,
      user_id: userId,
      channel: "in_app",
      title: "New invoice available",
      body: `${tenant.name} has issued your latest billing document for review.`,
      status: "sent",
      sent_at: "2026-04-02T08:15:00+05:30",
    },
    {
      id: ids.notificationAlert,
      tenant_id: tenantId,
      user_id: userId,
      channel: "in_app",
      title: "Service activation update",
      body: `${secondaryProduct.name} is still being provisioned for your account.`,
      status: "sent",
      sent_at: "2026-04-14T10:30:00+05:30",
    },
  ]);

  const summary = {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    },
    customer: {
      id: customer.id,
      email: customer.email,
    },
    seeded: {
      services: 2,
      orders: 2,
      invoices: 2,
      payments: 1,
      usage_records: 2,
      documents: 2,
      notifications: 2,
      products_visible: products.length,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
