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

async function countRows(supabase, table, tenantId) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }

  return count ?? 0;
}

async function main() {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
  loadEnvFile(path.join(repoRoot, ".env.local"));
  loadEnvFile(path.join(repoRoot, "apps/web/.env.local"));

  const args = parseArgs(process.argv.slice(2));
  const tenantId = args["tenant-id"];
  const tenantSlugArg = args["tenant-slug"];

  if (!tenantId) {
    throw new Error("Missing required argument --tenant-id");
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

  if (!tenant) {
    throw new Error(`Tenant not found for id ${tenantId}`);
  }

  const tenantSlug = tenantSlugArg ?? tenant.slug ?? "tenant";
  const locations = {
    core: seedId(tenantId, "location:core-noc"),
    branch: seedId(tenantId, "location:branch-pop"),
    hub: seedId(tenantId, "location:aggregation-hub"),
  };
  const customers = {
    northstar: seedId(tenantId, "customer:northstar"),
    meridian: seedId(tenantId, "customer:meridian"),
    seahaven: seedId(tenantId, "customer:seahaven"),
  };
  const accounts = {
    northstar: seedId(tenantId, "account:northstar"),
    meridian: seedId(tenantId, "account:meridian"),
    seahaven: seedId(tenantId, "account:seahaven"),
  };
  const products = {
    metro: seedId(tenantId, "product:metro-ethernet-1g"),
    sdwan: seedId(tenantId, "product:managed-sdwan-branch"),
    sip: seedId(tenantId, "product:sip-trunk-120"),
    backup: seedId(tenantId, "product:lte-backup-link"),
  };
  const vendors = {
    nokia: seedId(tenantId, "vendor:nokia"),
    cisco: seedId(tenantId, "vendor:cisco"),
  };
  const elements = {
    mumPe: seedId(tenantId, "element:mum-pe-01"),
    punEdge: seedId(tenantId, "element:pun-edge-02"),
    nvmOlt: seedId(tenantId, "element:nvm-olt-03"),
  };
  const interfaces = {
    mumUplink: seedId(tenantId, "interface:mum-pe-01:ge-1-1-0"),
    mumHandoff: seedId(tenantId, "interface:mum-pe-01:ge-1-1-1"),
    punWan: seedId(tenantId, "interface:pun-edge-02:wan0"),
    nvmPon: seedId(tenantId, "interface:nvm-olt-03:pon-1-7"),
  };
  const services = {
    northstar: seedId(tenantId, "service:northstar-metro"),
    meridian: seedId(tenantId, "service:meridian-sdwan"),
    seahaven: seedId(tenantId, "service:seahaven-sip"),
  };
  const assets = {
    fiberTray: seedId(tenantId, "asset:fiber-tray-mum-07"),
    branchEdge: seedId(tenantId, "asset:branch-edge-pun-02"),
    opticsShelf: seedId(tenantId, "asset:optics-shelf-nvm-03"),
  };
  const orders = {
    northstar: seedId(tenantId, "order:so-2026-000184"),
    meridian: seedId(tenantId, "order:so-2026-000231"),
    seahaven: seedId(tenantId, "order:so-2026-000312"),
  };
  const invoices = {
    northstar: seedId(tenantId, "invoice:inv-2026-02-1841"),
    meridian: seedId(tenantId, "invoice:inv-2026-02-2317"),
    seahaven: seedId(tenantId, "invoice:inv-2026-03-1184"),
  };
  const payments = {
    northstar: seedId(tenantId, "payment:hdfc-utr-20260308-1841"),
    meridian: seedId(tenantId, "payment:upi-axis-20260313-7721"),
  };
  const usage = {
    northstar: seedId(tenantId, "usage:northstar-feb"),
    meridian: seedId(tenantId, "usage:meridian-mar"),
    seahaven: seedId(tenantId, "usage:seahaven-mar"),
  };

  await upsertRows(supabase, "locations", [
    {
      id: locations.core,
      tenant_id: tenantId,
      name: "Mumbai Core NOC",
      address: "5th Floor, BKC One, Bandra Kurla Complex",
      city: "Mumbai",
      country: "IN",
    },
    {
      id: locations.branch,
      tenant_id: tenantId,
      name: "Pune Edge POP",
      address: "Plot 14, Hinjawadi Phase 2",
      city: "Pune",
      country: "IN",
    },
    {
      id: locations.hub,
      tenant_id: tenantId,
      name: "Navi Mumbai Aggregation Hub",
      address: "TTC Industrial Area, Mahape",
      city: "Navi Mumbai",
      country: "IN",
    },
  ]);

  await upsertRows(supabase, "customers", [
    {
      id: customers.northstar,
      tenant_id: tenantId,
      account_number: `${tenantSlug.toUpperCase()}-CUST-001`,
      first_name: "Priya",
      last_name: "Sharma",
      email: "priya.sharma@northstarlogistics.example",
      phone: "+91-98710-22001",
      address_json: {
        company: "NorthStar Logistics Pvt Ltd",
        line1: "Unit 201, Marathon Futurex",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400013",
        country: "IN",
      },
      status: "active",
    },
    {
      id: customers.meridian,
      tenant_id: tenantId,
      account_number: `${tenantSlug.toUpperCase()}-CUST-002`,
      first_name: "Rahul",
      last_name: "Menon",
      email: "rahul.menon@meridiandigital.example",
      phone: "+91-98190-34002",
      address_json: {
        company: "Meridian Digital Services",
        line1: "Tower B, EON Free Zone",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411014",
        country: "IN",
      },
      status: "active",
    },
    {
      id: customers.seahaven,
      tenant_id: tenantId,
      account_number: `${tenantSlug.toUpperCase()}-CUST-003`,
      first_name: "Asha",
      last_name: "Kulkarni",
      email: "asha.kulkarni@seahavenhospitals.example",
      phone: "+91-99201-77003",
      address_json: {
        company: "SeaHaven Hospitals",
        line1: "Palm Beach Road",
        city: "Navi Mumbai",
        state: "Maharashtra",
        postalCode: "400706",
        country: "IN",
      },
      status: "active",
    },
  ]);

  await upsertRows(supabase, "accounts", [
    {
      id: accounts.northstar,
      tenant_id: tenantId,
      customer_id: customers.northstar,
      account_type: "enterprise",
      status: "active",
      credit_limit: 150000,
      balance: 24850,
      currency: "INR",
    },
    {
      id: accounts.meridian,
      tenant_id: tenantId,
      customer_id: customers.meridian,
      account_type: "mid_market",
      status: "active",
      credit_limit: 95000,
      balance: 11640,
      currency: "INR",
    },
    {
      id: accounts.seahaven,
      tenant_id: tenantId,
      customer_id: customers.seahaven,
      account_type: "enterprise",
      status: "active",
      credit_limit: 180000,
      balance: 0,
      currency: "INR",
    },
  ]);

  await upsertRows(supabase, "products", [
    {
      id: products.metro,
      tenant_id: tenantId,
      name: "Metro Ethernet 1 Gbps",
      description:
        "Dedicated Layer 2 enterprise connectivity with 99.95% uptime commitment.",
      category: "connectivity",
      price: 42500,
      currency: "INR",
      billing_cycle: "monthly",
      lifecycle_status: "Active",
      version: "2026.1",
      valid_from: "2026-01-01T00:00:00+05:30",
      metadata_json: { serviceClass: "gold", accessType: "fiber" },
    },
    {
      id: products.sdwan,
      tenant_id: tenantId,
      name: "Managed SD-WAN Branch",
      description:
        "Managed branch edge with dual-underlay routing, analytics, and policy controls.",
      category: "managed_network",
      price: 28600,
      currency: "INR",
      billing_cycle: "monthly",
      lifecycle_status: "Active",
      version: "2026.2",
      valid_from: "2026-02-01T00:00:00+05:30",
      metadata_json: { serviceClass: "silver", deviceIncluded: true },
    },
    {
      id: products.sip,
      tenant_id: tenantId,
      name: "SIP Trunk 120 Channels",
      description:
        "Enterprise SIP trunk bundle for contact center and HQ voice workloads.",
      category: "voice",
      price: 19800,
      currency: "INR",
      billing_cycle: "monthly",
      lifecycle_status: "Active",
      version: "2026.1",
      valid_from: "2026-01-15T00:00:00+05:30",
      metadata_json: { serviceClass: "business", channels: 120, codec: "G.711" },
    },
    {
      id: products.backup,
      tenant_id: tenantId,
      name: "LTE Backup Link",
      description:
        "Managed LTE backup access for failover and continuity at branch sites.",
      category: "connectivity",
      price: 6200,
      currency: "INR",
      billing_cycle: "monthly",
      lifecycle_status: "Active",
      version: "2026.1",
      valid_from: "2026-01-20T00:00:00+05:30",
      metadata_json: { serviceClass: "bronze", accessType: "lte" },
    },
  ]);

  await upsertRows(supabase, "vendors", [
    {
      id: vendors.nokia,
      tenant_id: tenantId,
      name: "Nokia",
      type: "network_equipment",
      contact_json: {
        contact: "Enterprise Support Desk",
        email: "support.india@nokia.example",
        phone: "+91-22-4000-1000",
      },
    },
    {
      id: vendors.cisco,
      tenant_id: tenantId,
      name: "Cisco",
      type: "network_equipment",
      contact_json: {
        contact: "Service Provider Team",
        email: "sp-support-india@cisco.example",
        phone: "+91-80-4426-0000",
      },
    },
  ]);

  await upsertRows(supabase, "network_elements", [
    {
      id: elements.mumPe,
      tenant_id: tenantId,
      name: "MUM-PE-01",
      type: "provider_edge",
      vendor_id: vendors.nokia,
      model: "7750 SR-7",
      serial_number: "NSR7-MUM-2401",
      ip_address: "10.60.1.10",
      location_id: locations.core,
      status: "active",
      commissioned_at: "2025-11-18T09:30:00+05:30",
      metadata_json: { role: "core-routing", rack: "MUM-CR1", power: "dual" },
    },
    {
      id: elements.punEdge,
      tenant_id: tenantId,
      name: "PUN-SDWAN-EDGE-02",
      type: "sdwan_edge",
      vendor_id: vendors.cisco,
      model: "Catalyst 8500",
      serial_number: "C8500-PUN-117",
      ip_address: "10.60.18.22",
      location_id: locations.branch,
      status: "active",
      commissioned_at: "2025-12-09T14:00:00+05:30",
      metadata_json: { role: "branch-aggregation", rack: "PUN-BR2" },
    },
    {
      id: elements.nvmOlt,
      tenant_id: tenantId,
      name: "NVM-OLT-03",
      type: "olt",
      vendor_id: vendors.nokia,
      model: "ISAM FX-16",
      serial_number: "OLT-NVM-903",
      ip_address: "10.60.32.14",
      location_id: locations.hub,
      status: "degraded",
      commissioned_at: "2025-10-22T10:15:00+05:30",
      metadata_json: { role: "fiber-access", rack: "NVM-OLT3", ponPorts: 16 },
    },
  ]);

  await upsertRows(supabase, "network_interfaces", [
    {
      id: interfaces.mumUplink,
      tenant_id: tenantId,
      network_element_id: elements.mumPe,
      interface_name: "ge-1/1/0",
      type: "uplink",
      bandwidth_mbps: 10000,
      status: "active",
    },
    {
      id: interfaces.mumHandoff,
      tenant_id: tenantId,
      network_element_id: elements.mumPe,
      interface_name: "ge-1/1/1",
      type: "customer_handoff",
      bandwidth_mbps: 1000,
      status: "active",
    },
    {
      id: interfaces.punWan,
      tenant_id: tenantId,
      network_element_id: elements.punEdge,
      interface_name: "wan0",
      type: "transport",
      bandwidth_mbps: 2000,
      status: "active",
    },
    {
      id: interfaces.nvmPon,
      tenant_id: tenantId,
      network_element_id: elements.nvmOlt,
      interface_name: "pon-1/7",
      type: "access",
      bandwidth_mbps: 2500,
      status: "degraded",
    },
  ]);

  await upsertRows(supabase, "service_instances", [
    {
      id: services.northstar,
      tenant_id: tenantId,
      customer_id: customers.northstar,
      product_id: products.metro,
      network_element_id: elements.mumPe,
      status: "active",
      activated_at: "2026-01-09T11:00:00+05:30",
      config_json: { circuitId: "MUM-NSL-1001", vlan: 2201, qos: "gold" },
    },
    {
      id: services.meridian,
      tenant_id: tenantId,
      customer_id: customers.meridian,
      product_id: products.sdwan,
      network_element_id: elements.punEdge,
      status: "active",
      activated_at: "2026-02-03T15:30:00+05:30",
      config_json: { siteCode: "PUN-MDS-HQ", policyPack: "branch-standard" },
    },
    {
      id: services.seahaven,
      tenant_id: tenantId,
      customer_id: customers.seahaven,
      product_id: products.sip,
      network_element_id: elements.nvmOlt,
      status: "provisioning",
      activated_at: "2026-03-05T09:45:00+05:30",
      config_json: { didBlock: "0226100XXXX", channels: 120 },
    },
  ]);

  await upsertRows(supabase, "assets", [
    {
      id: assets.fiberTray,
      tenant_id: tenantId,
      name: "48-Core Fiber Tray MUM-07",
      asset_type: "fiber_plant",
      status: "active",
      location_id: locations.core,
      assigned_to: elements.mumPe,
      metadata_json: { spliceCount: 32, route: "BKC-Core-West" },
    },
    {
      id: assets.branchEdge,
      tenant_id: tenantId,
      name: "Branch Edge Appliance PUN-02",
      asset_type: "customer_premise_equipment",
      status: "active",
      location_id: locations.branch,
      assigned_to: elements.punEdge,
      metadata_json: { serial: "CPE-PUN-4432", managed: true },
    },
    {
      id: assets.opticsShelf,
      tenant_id: tenantId,
      name: "Optics Shelf NVM-03",
      asset_type: "optical_transport",
      status: "maintenance",
      location_id: locations.hub,
      assigned_to: elements.nvmOlt,
      metadata_json: { lastInspection: "2026-03-10", ticket: "TT-2026-0314" },
    },
  ]);

  await upsertRows(supabase, "orders", [
    {
      id: orders.northstar,
      tenant_id: tenantId,
      customer_id: customers.northstar,
      account_id: accounts.northstar,
      order_number: `${tenantSlug.toUpperCase()}-SO-2026-000184`,
      order_type: "new_install",
      status: "completed",
      items_json: [
        {
          productId: products.metro,
          productName: "Metro Ethernet 1 Gbps",
          quantity: 1,
          site: "Mumbai HQ",
        },
      ],
      total_amount: 42500,
      currency: "INR",
      fulfilled_at: "2026-01-09T16:20:00+05:30",
    },
    {
      id: orders.meridian,
      tenant_id: tenantId,
      customer_id: customers.meridian,
      account_id: accounts.meridian,
      order_number: `${tenantSlug.toUpperCase()}-SO-2026-000231`,
      order_type: "upgrade",
      status: "completed",
      items_json: [
        {
          productId: products.sdwan,
          productName: "Managed SD-WAN Branch",
          quantity: 1,
          site: "Pune Branch",
        },
      ],
      total_amount: 28600,
      currency: "INR",
      fulfilled_at: "2026-02-04T12:15:00+05:30",
    },
    {
      id: orders.seahaven,
      tenant_id: tenantId,
      customer_id: customers.seahaven,
      account_id: accounts.seahaven,
      order_number: `${tenantSlug.toUpperCase()}-SO-2026-000312`,
      order_type: "new_install",
      status: "in_progress",
      items_json: [
        {
          productId: products.sip,
          productName: "SIP Trunk 120 Channels",
          quantity: 1,
          site: "Navi Mumbai Campus",
        },
      ],
      total_amount: 19800,
      currency: "INR",
    },
  ]);

  await upsertRows(supabase, "invoices", [
    {
      id: invoices.northstar,
      tenant_id: tenantId,
      account_id: accounts.northstar,
      invoice_number: `${tenantSlug.toUpperCase()}-INV-2026-02-1841`,
      billing_period_start: "2026-02-01T00:00:00+05:30",
      billing_period_end: "2026-02-28T23:59:59+05:30",
      subtotal: 42500,
      tax: 7650,
      total: 50150,
      status: "paid",
      due_date: "2026-03-10",
      paid_at: "2026-03-08T11:40:00+05:30",
    },
    {
      id: invoices.meridian,
      tenant_id: tenantId,
      account_id: accounts.meridian,
      invoice_number: `${tenantSlug.toUpperCase()}-INV-2026-02-2317`,
      billing_period_start: "2026-02-01T00:00:00+05:30",
      billing_period_end: "2026-02-28T23:59:59+05:30",
      subtotal: 28600,
      tax: 5148,
      total: 33748,
      status: "issued",
      due_date: "2026-03-15",
    },
    {
      id: invoices.seahaven,
      tenant_id: tenantId,
      account_id: accounts.seahaven,
      invoice_number: `${tenantSlug.toUpperCase()}-INV-2026-03-1184`,
      billing_period_start: "2026-03-01T00:00:00+05:30",
      billing_period_end: "2026-03-31T23:59:59+05:30",
      subtotal: 19800,
      tax: 3564,
      total: 23364,
      status: "draft",
      due_date: "2026-04-12",
    },
  ]);

  await upsertRows(supabase, "payments", [
    {
      id: payments.northstar,
      tenant_id: tenantId,
      invoice_id: invoices.northstar,
      amount: 50150,
      currency: "INR",
      method: "bank_transfer",
      status: "captured",
      gateway_reference: "HDFC-UTR-20260308-1841",
      paid_at: "2026-03-08T11:40:00+05:30",
    },
    {
      id: payments.meridian,
      tenant_id: tenantId,
      invoice_id: invoices.meridian,
      amount: 15000,
      currency: "INR",
      method: "upi",
      status: "pending_settlement",
      gateway_reference: "UPI-AXIS-20260313-7721",
      paid_at: "2026-03-13T18:12:00+05:30",
    },
  ]);

  await upsertRows(supabase, "usage_records", [
    {
      id: usage.northstar,
      tenant_id: tenantId,
      account_id: accounts.northstar,
      service_instance_id: services.northstar,
      usage_type: "throughput_commitment",
      quantity: 1000,
      unit: "Mbps",
      rated_amount: 42500,
      recorded_at: "2026-02-28T23:00:00+05:30",
    },
    {
      id: usage.meridian,
      tenant_id: tenantId,
      account_id: accounts.meridian,
      service_instance_id: services.meridian,
      usage_type: "branch_bandwidth",
      quantity: 842.75,
      unit: "GB",
      rated_amount: 28600,
      recorded_at: "2026-03-12T22:30:00+05:30",
    },
    {
      id: usage.seahaven,
      tenant_id: tenantId,
      account_id: accounts.seahaven,
      service_instance_id: services.seahaven,
      usage_type: "voice_channels_reserved",
      quantity: 120,
      unit: "channels",
      rated_amount: 19800,
      recorded_at: "2026-03-13T09:00:00+05:30",
    },
  ]);

  const counts = {
    customers: await countRows(supabase, "customers", tenantId),
    accounts: await countRows(supabase, "accounts", tenantId),
    products: await countRows(supabase, "products", tenantId),
    network_elements: await countRows(supabase, "network_elements", tenantId),
    service_instances: await countRows(supabase, "service_instances", tenantId),
    assets: await countRows(supabase, "assets", tenantId),
    orders: await countRows(supabase, "orders", tenantId),
    invoices: await countRows(supabase, "invoices", tenantId),
    payments: await countRows(supabase, "payments", tenantId),
    usage_records: await countRows(supabase, "usage_records", tenantId),
  };

  console.log(
    JSON.stringify(
      {
        tenant: {
          id: tenant.id,
          slug: tenantSlug,
          name: tenant.name,
        },
        counts,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
