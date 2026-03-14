import { createHash } from "crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type DemoUserSpec = {
  email: string;
  fullName: string;
  department: string;
  role: "admin" | "inventory_manager" | "customer";
  customerId?: string;
  accountId?: string;
};

function demoPassword(tenantSlug: string) {
  return `TelecoSync@${tenantSlug}`;
}

function seedId(tenantId: string, scope: string) {
  const hex = createHash("sha1")
    .update(`${tenantId}:${scope}`)
    .digest("hex")
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id" });

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

async function ensureRole(
  tenantId: string,
  roleName: "admin" | "inventory_manager" | "customer",
) {
  const supabase = createAdminSupabaseClient();
  const roleId = seedId(tenantId, `role:${roleName}`);
  const permissionsByRole = {
    admin: {
      customers: ["read", "write"],
      products: ["read", "write"],
      orders: ["read", "write"],
      billing: ["read", "write"],
      revenue: ["read", "write"],
      operations: ["read", "write"],
      admin: ["read", "write"],
    },
    inventory_manager: {
      customers: ["read"],
      products: ["read", "write"],
      orders: ["read"],
      billing: ["read", "write"],
      operations: ["read", "write"],
    },
    customer: {
      customer: ["read"],
      products: ["read"],
      orders: ["read"],
      billing: ["read"],
    },
  } as const;

  const { error } = await supabase.from("roles").upsert(
    {
      id: roleId,
      tenant_id: tenantId,
      name: roleName,
      permissions_json: permissionsByRole[roleName],
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`roles: ${error.message}`);
  }

  return roleId;
}

async function ensureDemoUsers(
  tenantId: string,
  tenantSlug: string,
  specs: DemoUserSpec[],
) {
  const supabase = createAdminSupabaseClient();
  const adminRoleId = await ensureRole(tenantId, "admin");
  const customerRoleId = await ensureRole(tenantId, "customer");
  const inventoryManagerRoleId = await ensureRole(
    tenantId,
    "inventory_manager",
  );
  const roleIds = {
    admin: adminRoleId,
    customer: customerRoleId,
    inventory_manager: inventoryManagerRoleId,
  };
  const seededPassword = demoPassword(tenantSlug);

  const { data } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const usersByEmail = new Map(
    (data?.users ?? []).map((user) => [user.email?.toLowerCase() ?? "", user]),
  );

  for (const spec of specs) {
    const existing = usersByEmail.get(spec.email.toLowerCase());
    const metadata = {
      full_name: spec.fullName,
      department: spec.department,
      tenant_id: tenantId,
      tenant_slug: tenantSlug,
      role: spec.role,
      ...(spec.customerId ? { customer_id: spec.customerId } : {}),
      ...(spec.accountId ? { account_id: spec.accountId } : {}),
    };

    const appMetadata = {
      tenant_id: tenantId,
      tenant_slug: tenantSlug,
      role: spec.role,
      ...(spec.customerId ? { customer_id: spec.customerId } : {}),
      ...(spec.accountId ? { account_id: spec.accountId } : {}),
    };

    let userId = existing?.id;

    if (existing?.id) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        email: spec.email,
        password: seededPassword,
        user_metadata: metadata,
        app_metadata: appMetadata,
        email_confirm: true,
      });

      if (error) {
        throw new Error(`auth.users: ${error.message}`);
      }
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: spec.email,
        password: seededPassword,
        email_confirm: true,
        user_metadata: metadata,
        app_metadata: appMetadata,
      });

      if (error || !created.user) {
        throw new Error(
          `auth.users: ${error?.message ?? "Unable to create demo user."}`,
        );
      }

      userId = created.user.id;
    }

    if (!userId) {
      throw new Error(`auth.users: Missing id for ${spec.email}.`);
    }

    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        id: userId,
        tenant_id: tenantId,
        role_id: roleIds[spec.role],
        full_name: spec.fullName,
        department: spec.department,
        status: "active",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw new Error(`user_profiles: ${profileError.message}`);
    }
  }
}

export async function seedDemoTenantData(
  tenantId: string,
  tenantSlug: string,
  actorUserId?: string | null,
) {
  const locations = {
    mumbai: seedId(tenantId, "location:mumbai-core"),
    pune: seedId(tenantId, "location:pune-pop"),
    naviMumbai: seedId(tenantId, "location:navi-mumbai-hub"),
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
  const metrics = {
    uptime: seedId(tenantId, "metric:mum-uptime"),
    latency: seedId(tenantId, "metric:mum-latency"),
    packetLoss: seedId(tenantId, "metric:pun-packet-loss"),
    temperature: seedId(tenantId, "metric:nvm-temperature"),
  };
  const tickets = {
    olt: seedId(tenantId, "ticket:tt-2026-0314"),
    failover: seedId(tenantId, "ticket:tt-2026-0307"),
  };
  const alarms = {
    olt: seedId(tenantId, "alarm:nvm-olt-critical"),
    failover: seedId(tenantId, "alarm:pun-jitter-warning"),
  };
  const workflows = {
    activation: seedId(tenantId, "workflow:activation"),
    escalation: seedId(tenantId, "workflow:escalation"),
  };
  const workflowInstances = {
    activation: seedId(tenantId, "workflow-instance:activation"),
    escalation: seedId(tenantId, "workflow-instance:escalation"),
  };
  const slas = {
    ethernet: seedId(tenantId, "sla:ethernet-gold"),
    sdwan: seedId(tenantId, "sla:sdwan-standard"),
  };
  const revenueJobs = {
    feb: seedId(tenantId, "revenue-job:february"),
    mar: seedId(tenantId, "revenue-job:march"),
  };
  const discrepancies = {
    feb: seedId(tenantId, "revenue-discrepancy:february"),
    mar: seedId(tenantId, "revenue-discrepancy:march"),
  };
  const reconciliationRuns = {
    feb: seedId(tenantId, "reconciliation:february"),
    mar: seedId(tenantId, "reconciliation:march"),
  };
  const settlements = {
    vendor: seedId(tenantId, "settlement:vendor-february"),
    customer: seedId(tenantId, "settlement:customer-february"),
  };
  const reports = {
    margin: seedId(tenantId, "report:monthly-margin"),
    collections: seedId(tenantId, "report:collections"),
  };
  const registry = {
    catalog: seedId(tenantId, "api-registry:catalog"),
    orders: seedId(tenantId, "api-registry:orders"),
    services: seedId(tenantId, "api-registry:services"),
  };
  const webhooks = {
    finance: seedId(tenantId, "webhook:finance"),
    noc: seedId(tenantId, "webhook:noc"),
  };
  const deliveries = {
    finance: seedId(tenantId, "webhook-delivery:finance"),
    noc: seedId(tenantId, "webhook-delivery:noc"),
  };
  const events = {
    invoice: seedId(tenantId, "event:invoice"),
    payment: seedId(tenantId, "event:payment"),
    alarm: seedId(tenantId, "event:alarm"),
    workflow: seedId(tenantId, "event:workflow"),
  };
  const connectors = {
    erp: seedId(tenantId, "connector:erp"),
    nms: seedId(tenantId, "connector:nms"),
    payment: seedId(tenantId, "connector:payment"),
  };
  const connectorRuns = {
    erp: seedId(tenantId, "connector-run:erp"),
    nms: seedId(tenantId, "connector-run:nms"),
    payment: seedId(tenantId, "connector-run:payment"),
  };
  const promotions = {
    metro: seedId(tenantId, "promotion:metro"),
    sdwan: seedId(tenantId, "promotion:sdwan"),
  };
  const ratingRules = {
    metro: seedId(tenantId, "rating-rule:metro"),
    sip: seedId(tenantId, "rating-rule:sip"),
  };
  const notifications = {
    issued: seedId(tenantId, "notification:invoice-issued"),
    alarm: seedId(tenantId, "notification:alarm-open"),
    reconciliation: seedId(tenantId, "notification:reconciliation"),
  };
  const documents = {
    northstar: seedId(tenantId, "document:northstar-contract"),
    meridian: seedId(tenantId, "document:meridian-bill-pack"),
    seahaven: seedId(tenantId, "document:seahaven-onboarding"),
  };

  await ensureRole(tenantId, "admin");
  await ensureRole(tenantId, "inventory_manager");
  await ensureRole(tenantId, "customer");

  await upsertRows("locations", [
    {
      id: locations.mumbai,
      tenant_id: tenantId,
      name: "Mumbai Core NOC",
      address: "5th Floor, BKC One, Bandra Kurla Complex",
      city: "Mumbai",
      country: "IN",
    },
    {
      id: locations.pune,
      tenant_id: tenantId,
      name: "Pune Edge POP",
      address: "Plot 14, Hinjawadi Phase 2",
      city: "Pune",
      country: "IN",
    },
    {
      id: locations.naviMumbai,
      tenant_id: tenantId,
      name: "Navi Mumbai Aggregation Hub",
      address: "TTC Industrial Area, Mahape",
      city: "Navi Mumbai",
      country: "IN",
    },
  ]);

  await upsertRows("customers", [
    {
      id: customers.northstar,
      tenant_id: tenantId,
      account_number: "ENT-MUM-24001",
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
      account_number: "ENT-PUN-24007",
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
      account_number: "ENT-NVM-24013",
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

  await upsertRows("accounts", [
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

  await ensureDemoUsers(tenantId, tenantSlug, [
    {
      email: `admin@${tenantSlug}.example`,
      fullName: "TelecoSync Admin",
      department: "Administration",
      role: "admin",
    },
    {
      email: "ops.manager@" + tenantSlug + ".example",
      fullName: "Nilesh Patil",
      department: "Inventory",
      role: "inventory_manager",
    },
    {
      email: "priya.sharma@northstarlogistics.example",
      fullName: "Priya Sharma",
      department: "Customer",
      role: "customer",
      customerId: customers.northstar,
      accountId: accounts.northstar,
    },
    {
      email: "rahul.menon@meridiandigital.example",
      fullName: "Rahul Menon",
      department: "Customer",
      role: "customer",
      customerId: customers.meridian,
      accountId: accounts.meridian,
    },
    {
      email: "asha.kulkarni@seahavenhospitals.example",
      fullName: "Asha Kulkarni",
      department: "Customer",
      role: "customer",
      customerId: customers.seahaven,
      accountId: accounts.seahaven,
    },
  ]);

  await upsertRows("products", [
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
      metadata_json: {
        serviceClass: "silver",
        deviceIncluded: true,
        overlay: "sd-wan",
      },
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
      metadata_json: {
        serviceClass: "business",
        channels: 120,
        codec: "G.711",
      },
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

  await upsertRows("promotions", [
    {
      id: promotions.metro,
      tenant_id: tenantId,
      product_id: products.metro,
      name: "Quarterly Metro Access Launch",
      discount_type: "pct",
      discount_value: 10,
      valid_from: "2026-01-01T00:00:00+05:30",
      valid_to: "2026-03-31T23:59:59+05:30",
    },
    {
      id: promotions.sdwan,
      tenant_id: tenantId,
      product_id: products.sdwan,
      name: "Branch Bundle Discount",
      discount_type: "fixed",
      discount_value: 5000,
      valid_from: "2026-02-01T00:00:00+05:30",
      valid_to: "2026-04-30T23:59:59+05:30",
    },
  ]);

  await upsertRows("rating_rules", [
    {
      id: ratingRules.metro,
      tenant_id: tenantId,
      product_id: products.metro,
      rule_type: "monthly_recurring",
      condition_json: { committedBandwidthMbps: 1000 },
      rate: 42500,
      currency: "INR",
      priority: 10,
    },
    {
      id: ratingRules.sip,
      tenant_id: tenantId,
      product_id: products.sip,
      rule_type: "channel_reservation",
      condition_json: { channels: 120 },
      rate: 19800,
      currency: "INR",
      priority: 10,
    },
  ]);

  await upsertRows("vendors", [
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

  await upsertRows("network_elements", [
    {
      id: elements.mumPe,
      tenant_id: tenantId,
      name: "MUM-PE-01",
      type: "provider_edge",
      vendor_id: vendors.nokia,
      model: "7750 SR-7",
      serial_number: "NSR7-MUM-2401",
      ip_address: "10.60.1.10",
      location_id: locations.mumbai,
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
      location_id: locations.pune,
      status: "active",
      commissioned_at: "2025-12-09T14:00:00+05:30",
      metadata_json: {
        role: "branch-aggregation",
        rack: "PUN-BR2",
        license: "dna-adv",
      },
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
      location_id: locations.naviMumbai,
      status: "degraded",
      commissioned_at: "2025-10-22T10:15:00+05:30",
      metadata_json: { role: "fiber-access", rack: "NVM-OLT3", ponPorts: 16 },
    },
  ]);

  await upsertRows("network_interfaces", [
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

  await upsertRows("service_instances", [
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
      config_json: {
        siteCode: "PUN-MDS-HQ",
        policyPack: "branch-standard",
        underlay: ["fiber", "4g"],
      },
    },
    {
      id: services.seahaven,
      tenant_id: tenantId,
      customer_id: customers.seahaven,
      product_id: products.sip,
      network_element_id: elements.nvmOlt,
      status: "provisioning",
      activated_at: "2026-03-05T09:45:00+05:30",
      config_json: {
        didBlock: "0226100XXXX",
        channels: 120,
        carrier: "AstraVoice",
      },
    },
  ]);

  await upsertRows("assets", [
    {
      id: assets.fiberTray,
      tenant_id: tenantId,
      name: "48-Core Fiber Tray MUM-07",
      asset_type: "fiber_plant",
      status: "active",
      location_id: locations.mumbai,
      assigned_to: elements.mumPe,
      metadata_json: { spliceCount: 32, route: "BKC-Core-West" },
    },
    {
      id: assets.branchEdge,
      tenant_id: tenantId,
      name: "Branch Edge Appliance PUN-02",
      asset_type: "customer_premise_equipment",
      status: "active",
      location_id: locations.pune,
      assigned_to: elements.punEdge,
      metadata_json: { serial: "CPE-PUN-4432", managed: true },
    },
    {
      id: assets.opticsShelf,
      tenant_id: tenantId,
      name: "Optics Shelf NVM-03",
      asset_type: "optical_transport",
      status: "maintenance",
      location_id: locations.naviMumbai,
      assigned_to: elements.nvmOlt,
      metadata_json: { lastInspection: "2026-03-10", ticket: "TT-2026-0314" },
    },
  ]);

  await upsertRows("orders", [
    {
      id: orders.northstar,
      tenant_id: tenantId,
      customer_id: customers.northstar,
      account_id: accounts.northstar,
      order_number: "SO-2026-000184",
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
      order_number: "SO-2026-000231",
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
      order_number: "SO-2026-000312",
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

  await upsertRows("invoices", [
    {
      id: invoices.northstar,
      tenant_id: tenantId,
      account_id: accounts.northstar,
      invoice_number: "INV-2026-02-1841",
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
      invoice_number: "INV-2026-02-2317",
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
      invoice_number: "INV-2026-03-1184",
      billing_period_start: "2026-03-01T00:00:00+05:30",
      billing_period_end: "2026-03-31T23:59:59+05:30",
      subtotal: 19800,
      tax: 3564,
      total: 23364,
      status: "draft",
      due_date: "2026-04-12",
    },
  ]);

  await upsertRows("payments", [
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

  await upsertRows("usage_records", [
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

  await upsertRows("performance_metrics", [
    {
      id: metrics.uptime,
      tenant_id: tenantId,
      network_element_id: elements.mumPe,
      metric_type: "uptime",
      value: 99.982,
      unit: "pct",
      recorded_at: "2026-03-14T08:00:00+05:30",
    },
    {
      id: metrics.latency,
      tenant_id: tenantId,
      network_element_id: elements.mumPe,
      metric_type: "latency",
      value: 4.8,
      unit: "ms",
      recorded_at: "2026-03-14T08:00:00+05:30",
    },
    {
      id: metrics.packetLoss,
      tenant_id: tenantId,
      network_element_id: elements.punEdge,
      metric_type: "packet_loss",
      value: 0.03,
      unit: "pct",
      recorded_at: "2026-03-14T08:00:00+05:30",
    },
    {
      id: metrics.temperature,
      tenant_id: tenantId,
      network_element_id: elements.nvmOlt,
      metric_type: "temperature",
      value: 41.2,
      unit: "celsius",
      recorded_at: "2026-03-14T08:00:00+05:30",
    },
  ]);

  await upsertRows("trouble_tickets", [
    {
      id: tickets.olt,
      tenant_id: tenantId,
      ticket_number: "TT-2026-0314",
      title: "High optical attenuation on access uplink",
      description:
        "Field telemetry shows elevated dBm loss on the Navi Mumbai OLT uplink affecting new voice provisioning.",
      severity: "major",
      status: "open",
      network_element_id: elements.nvmOlt,
      service_instance_id: services.seahaven,
    },
    {
      id: tickets.failover,
      tenant_id: tenantId,
      ticket_number: "TT-2026-0307",
      title: "Branch underlay failover observed",
      description:
        "Primary fiber underlay flapped for 96 seconds; service recovered on LTE backup and has remained stable.",
      severity: "minor",
      status: "resolved",
      network_element_id: elements.punEdge,
      service_instance_id: services.meridian,
      resolved_at: "2026-03-07T13:25:00+05:30",
    },
  ]);

  await upsertRows("alarms", [
    {
      id: alarms.olt,
      tenant_id: tenantId,
      network_element_id: elements.nvmOlt,
      severity: "critical",
      description:
        "PON port utilization exceeded threshold and optical power drift crossed policy limits.",
      source: "NMS",
      status: "active",
      raised_at: "2026-03-14T07:42:00+05:30",
    },
    {
      id: alarms.failover,
      tenant_id: tenantId,
      network_element_id: elements.punEdge,
      severity: "warning",
      description:
        "WAN0 underlay experienced jitter spike above 35 ms for four polling intervals.",
      source: "SDWAN_CONTROLLER",
      status: "cleared",
      raised_at: "2026-03-07T11:02:00+05:30",
      cleared_at: "2026-03-07T11:10:00+05:30",
    },
  ]);

  await upsertRows("workflows", [
    {
      id: workflows.activation,
      tenant_id: tenantId,
      name: "Enterprise service activation",
      trigger_type: "order.completed",
      steps_json: [
        { step: "validate_order", owner: "orchestration" },
        { step: "reserve_capacity", owner: "network-ops" },
        { step: "notify_customer", owner: "service-desk" },
      ],
      status: "active",
      version: 3,
    },
    {
      id: workflows.escalation,
      tenant_id: tenantId,
      name: "Critical alarm escalation",
      trigger_type: "alarm.raised",
      steps_json: [
        { step: "create_ticket", owner: "noc" },
        { step: "page_field_team", owner: "field-ops" },
        { step: "send_customer_advisory", owner: "customer-success" },
      ],
      status: "active",
      version: 2,
    },
  ]);

  await upsertRows("workflow_instances", [
    {
      id: workflowInstances.activation,
      tenant_id: tenantId,
      workflow_id: workflows.activation,
      entity_type: "order",
      entity_id: orders.northstar,
      current_step: 3,
      state_json: { capacityReserved: true, customerNotified: true },
      status: "completed",
      started_at: "2026-01-09T10:30:00+05:30",
      completed_at: "2026-01-09T16:25:00+05:30",
    },
    {
      id: workflowInstances.escalation,
      tenant_id: tenantId,
      workflow_id: workflows.escalation,
      entity_type: "alarm",
      entity_id: alarms.olt,
      current_step: 2,
      state_json: { ticketCreated: "TT-2026-0314", fieldTeamPaged: true },
      status: "running",
      started_at: "2026-03-14T07:43:00+05:30",
    },
  ]);

  await upsertRows("slas", [
    {
      id: slas.ethernet,
      tenant_id: tenantId,
      name: "Enterprise Ethernet Gold",
      metric_type: "uptime_pct",
      target_value: 99.95,
      measurement_window: "monthly",
      penalty_json: { creditPct: 7.5, breachWindow: "30m" },
    },
    {
      id: slas.sdwan,
      tenant_id: tenantId,
      name: "Managed SD-WAN Standard",
      metric_type: "latency_ms",
      target_value: 20,
      measurement_window: "weekly",
      penalty_json: { creditPct: 3, breachWindow: "15m" },
    },
  ]);

  await upsertRows("sla_violations", [
    {
      id: seedId(tenantId, "sla-violation:sdwan"),
      tenant_id: tenantId,
      sla_id: slas.sdwan,
      entity_type: "network_element",
      entity_id: elements.punEdge,
      actual_value: 35.4,
      target_value: 20,
      period_start: "2026-03-07T11:00:00+05:30",
      period_end: "2026-03-07T11:15:00+05:30",
      penalty_applied: 1250,
    },
  ]);

  await upsertRows("revenue_assurance_jobs", [
    {
      id: revenueJobs.feb,
      tenant_id: tenantId,
      period_start: "2026-02-01T00:00:00+05:30",
      period_end: "2026-02-28T23:59:59+05:30",
      status: "completed",
      total_billed: 83898,
      total_rated: 85250,
      leakage_pct: 1.6126,
      triggered_by: actorUserId ?? null,
      completed_at: "2026-03-03T06:20:00+05:30",
    },
    {
      id: revenueJobs.mar,
      tenant_id: tenantId,
      period_start: "2026-03-01T00:00:00+05:30",
      period_end: "2026-03-31T23:59:59+05:30",
      status: "running",
      total_billed: 23364,
      total_rated: 19800,
      leakage_pct: -18,
      triggered_by: actorUserId ?? null,
    },
  ]);

  await upsertRows("revenue_discrepancies", [
    {
      id: discrepancies.feb,
      job_id: revenueJobs.feb,
      account_id: accounts.meridian,
      usage_record_id: usage.meridian,
      invoice_id: invoices.meridian,
      discrepancy_type: "partial_collection",
      expected_amount: 28600,
      actual_amount: 15000,
      resolution: "Awaiting settlement confirmation",
      created_at: "2026-03-03T06:22:00+05:30",
    },
    {
      id: discrepancies.mar,
      job_id: revenueJobs.mar,
      account_id: accounts.seahaven,
      usage_record_id: usage.seahaven,
      invoice_id: invoices.seahaven,
      discrepancy_type: "unbilled_usage",
      expected_amount: 19800,
      actual_amount: 0,
      resolution: "Draft invoice still open",
      created_at: "2026-03-14T06:15:00+05:30",
    },
  ]);

  await upsertRows("reconciliation_runs", [
    {
      id: reconciliationRuns.feb,
      tenant_id: tenantId,
      period_start: "2026-02-01T00:00:00+05:30",
      period_end: "2026-02-28T23:59:59+05:30",
      status: "approved",
      gross_revenue: 83898,
      adjustments: -1250,
      approved_by: actorUserId ?? null,
      approved_at: "2026-03-05T17:10:00+05:30",
      notes:
        "Credit note issued for branch failover incident lasting 96 seconds.",
    },
    {
      id: reconciliationRuns.mar,
      tenant_id: tenantId,
      period_start: "2026-03-01T00:00:00+05:30",
      period_end: "2026-03-31T23:59:59+05:30",
      status: "draft",
      gross_revenue: 23364,
      adjustments: 0,
      notes: "March close remains open pending SIP trunk activation milestone.",
    },
  ]);

  await upsertRows("settlement_statements", [
    {
      id: settlements.vendor,
      tenant_id: tenantId,
      partner_id: vendors.nokia,
      partner_type: "vendor",
      period_start: "2026-02-01T00:00:00+05:30",
      period_end: "2026-02-28T23:59:59+05:30",
      direction: "payable",
      gross_amount: 420000,
      tax_amount: 75600,
      net_amount: 495600,
      currency: "INR",
      status: "approved",
      due_date: "2026-03-25",
    },
    {
      id: settlements.customer,
      tenant_id: tenantId,
      partner_id: customers.northstar,
      partner_type: "customer",
      period_start: "2026-02-01T00:00:00+05:30",
      period_end: "2026-02-28T23:59:59+05:30",
      direction: "receivable",
      gross_amount: 42500,
      tax_amount: 7650,
      net_amount: 50150,
      currency: "INR",
      status: "received",
      due_date: "2026-03-10",
      paid_at: "2026-03-08T11:40:00+05:30",
    },
  ]);

  await upsertRows("financial_reports", [
    {
      id: reports.margin,
      tenant_id: tenantId,
      report_type: "monthly_margin",
      period_start: "2026-02-01T00:00:00+05:30",
      period_end: "2026-02-28T23:59:59+05:30",
      payload_json: {
        grossRevenue: 83898,
        networkCost: 420000,
        creditNotes: 1250,
        marginPct: 18.4,
      },
      generated_by: actorUserId ?? null,
    },
    {
      id: reports.collections,
      tenant_id: tenantId,
      report_type: "collections_snapshot",
      period_start: "2026-03-01T00:00:00+05:30",
      period_end: "2026-03-14T23:59:59+05:30",
      payload_json: {
        current: 50150,
        overdue_0_30: 33748,
        overdue_31_60: 0,
        unbilled: 23364,
      },
      generated_by: actorUserId ?? null,
    },
  ]);

  await upsertRows("api_registry", [
    {
      id: registry.catalog,
      tenant_id: tenantId,
      name: "Product Catalog API",
      slug: "product-catalog",
      version: "v4",
      standard: "TMF620",
      base_url: "https://api." + tenantSlug + ".example/catalog",
      spec_url:
        "https://developer." +
        tenantSlug +
        ".example/apis/catalog/v4/openapi.yaml",
      auth_type: "bearer",
      status: "active",
      owner_team: "Digital Commerce",
    },
    {
      id: registry.orders,
      tenant_id: tenantId,
      name: "Order Orchestration API",
      slug: "order-orchestration",
      version: "v4",
      standard: "TMF622",
      base_url: "https://api." + tenantSlug + ".example/orders",
      spec_url:
        "https://developer." +
        tenantSlug +
        ".example/apis/orders/v4/openapi.yaml",
      auth_type: "bearer",
      status: "active",
      owner_team: "Service Fulfilment",
    },
    {
      id: registry.services,
      tenant_id: tenantId,
      name: "Service Inventory API",
      slug: "service-inventory",
      version: "v4",
      standard: "TMF638",
      base_url: "https://api." + tenantSlug + ".example/service-inventory",
      spec_url:
        "https://developer." +
        tenantSlug +
        ".example/apis/service-inventory/v4/openapi.yaml",
      auth_type: "bearer",
      status: "active",
      owner_team: "Operations Engineering",
    },
  ]);

  await upsertRows("webhook_subscriptions", [
    {
      id: webhooks.finance,
      tenant_id: tenantId,
      name: "Finance Ledger Sink",
      target_url: "https://ledger." + tenantSlug + ".example/hooks/invoices",
      secret: `ledger-hook-${tenantSlug}`,
      event_types: [
        "invoice.generated",
        "payment.captured",
        "settlement.approved",
      ],
      headers_json: { "x-partner": "finance-ledger", "x-source": "telecosync" },
      enabled: true,
    },
    {
      id: webhooks.noc,
      tenant_id: tenantId,
      name: "NOC Event Stream",
      target_url: "https://noc." + tenantSlug + ".example/hooks/events",
      secret: `noc-hook-${tenantSlug}`,
      event_types: ["alarm.raised", "ticket.created", "workflow.started"],
      headers_json: { "x-team": "noc", "x-priority": "high" },
      enabled: true,
    },
  ]);

  await upsertRows("webhook_deliveries", [
    {
      id: deliveries.finance,
      tenant_id: tenantId,
      subscription_id: webhooks.finance,
      event_type: "payment.captured",
      payload_json: {
        invoiceNumber: "INV-2026-02-1841",
        amount: 50150,
        currency: "INR",
      },
      http_status: 200,
      response_body: '{"status":"accepted"}',
      attempt_number: 1,
      status: "delivered",
      delivered_at: "2026-03-08T11:41:05+05:30",
    },
    {
      id: deliveries.noc,
      tenant_id: tenantId,
      subscription_id: webhooks.noc,
      event_type: "alarm.raised",
      payload_json: { element: "NVM-OLT-03", severity: "critical" },
      http_status: 202,
      response_body: '{"queued":true}',
      attempt_number: 1,
      status: "delivered",
      delivered_at: "2026-03-14T07:43:03+05:30",
    },
  ]);

  await upsertRows("event_log", [
    {
      id: events.invoice,
      tenant_id: tenantId,
      event_type: "invoice.generated",
      entity_type: "invoice",
      entity_id: invoices.meridian,
      payload_json: { invoiceNumber: "INV-2026-02-2317", total: 33748 },
      source_service: "billing-engine",
      fired_at: "2026-03-01T06:00:00+05:30",
      processed: true,
      processed_at: "2026-03-01T06:00:02+05:30",
    },
    {
      id: events.payment,
      tenant_id: tenantId,
      event_type: "payment.captured",
      entity_type: "payment",
      entity_id: payments.northstar,
      payload_json: { invoiceNumber: "INV-2026-02-1841", amount: 50150 },
      source_service: "payments-gateway",
      fired_at: "2026-03-08T11:40:00+05:30",
      processed: true,
      processed_at: "2026-03-08T11:40:04+05:30",
    },
    {
      id: events.alarm,
      tenant_id: tenantId,
      event_type: "alarm.raised",
      entity_type: "alarm",
      entity_id: alarms.olt,
      payload_json: { severity: "critical", element: "NVM-OLT-03" },
      source_service: "nms-ingest",
      fired_at: "2026-03-14T07:42:00+05:30",
      processed: false,
    },
    {
      id: events.workflow,
      tenant_id: tenantId,
      event_type: "workflow.started",
      entity_type: "workflow_instance",
      entity_id: workflowInstances.escalation,
      payload_json: {
        workflow: "Critical alarm escalation",
        alarmRef: "NVM-OLT-03",
      },
      source_service: "workflow-engine",
      fired_at: "2026-03-14T07:43:00+05:30",
      processed: false,
    },
  ]);

  await upsertRows("notifications", [
    {
      id: notifications.issued,
      tenant_id: tenantId,
      user_id: actorUserId ?? null,
      channel: "email",
      title: "Invoice INV-2026-02-2317 issued",
      body: "February managed SD-WAN charges for Meridian Digital Services are ready for customer delivery.",
      status: "sent",
      sent_at: "2026-03-01T06:05:00+05:30",
    },
    {
      id: notifications.alarm,
      tenant_id: tenantId,
      user_id: actorUserId ?? null,
      channel: "in_app",
      title: "Critical alarm on NVM-OLT-03",
      body: "Optical power drift remains above policy threshold and customer provisioning may be impacted.",
      status: "sent",
      sent_at: "2026-03-14T07:44:00+05:30",
    },
    {
      id: notifications.reconciliation,
      tenant_id: tenantId,
      user_id: actorUserId ?? null,
      channel: "in_app",
      title: "February reconciliation approved",
      body: "Period close for February has been approved with a branch failover credit adjustment.",
      status: "read",
      sent_at: "2026-03-05T17:12:00+05:30",
      read_at: "2026-03-05T17:20:00+05:30",
    },
  ]);

  await upsertRows("documents", [
    {
      id: documents.northstar,
      tenant_id: tenantId,
      entity_type: "customer",
      entity_id: customers.northstar,
      name: "NorthStar Metro Ethernet service pack.pdf",
      storage_path: `${tenantId}/demo/northstar-metro-service-pack.pdf`,
      mime_type: "application/pdf",
      size_bytes: 248320,
      uploaded_by: actorUserId ?? null,
    },
    {
      id: documents.meridian,
      tenant_id: tenantId,
      entity_type: "customer",
      entity_id: customers.meridian,
      name: "Meridian SD-WAN billing summary.pdf",
      storage_path: `${tenantId}/demo/meridian-sdwan-billing-summary.pdf`,
      mime_type: "application/pdf",
      size_bytes: 192448,
      uploaded_by: actorUserId ?? null,
    },
    {
      id: documents.seahaven,
      tenant_id: tenantId,
      entity_type: "customer",
      entity_id: customers.seahaven,
      name: "SeaHaven SIP onboarding checklist.pdf",
      storage_path: `${tenantId}/demo/seahaven-sip-onboarding-checklist.pdf`,
      mime_type: "application/pdf",
      size_bytes: 158720,
      uploaded_by: actorUserId ?? null,
    },
  ]);

  await upsertRows("integration_connectors", [
    {
      id: connectors.erp,
      tenant_id: tenantId,
      name: "Oracle ERP Billing Export",
      connector_type: "rest",
      direction: "outbound",
      system_type: "erp",
      config_json: {
        endpoint:
          "https://erp." + tenantSlug + ".example/api/v1/billing/export",
        method: "POST",
        schedule: "0 */6 * * *",
      },
      enabled: true,
      last_run_at: "2026-03-14T06:00:00+05:30",
      last_run_status: "success",
    },
    {
      id: connectors.nms,
      tenant_id: tenantId,
      name: "SolarWinds NMS Alarm Ingest",
      connector_type: "rest",
      direction: "inbound",
      system_type: "nms",
      config_json: {
        endpoint: "https://nms." + tenantSlug + ".example/events/alarms",
        method: "POST",
        validation: "hmac-sha256",
      },
      enabled: true,
      last_run_at: "2026-03-14T07:42:00+05:30",
      last_run_status: "success",
    },
    {
      id: connectors.payment,
      tenant_id: tenantId,
      name: "Collections Feed",
      connector_type: "rest",
      direction: "bidirectional",
      system_type: "payment",
      config_json: {
        endpoint: "https://payments." + tenantSlug + ".example/collections",
        method: "POST",
        retryPolicy: "exponential",
      },
      enabled: true,
      last_run_at: "2026-03-13T18:12:00+05:30",
      last_run_status: "success",
    },
  ]);

  await upsertRows("connector_executions", [
    {
      id: connectorRuns.erp,
      tenant_id: tenantId,
      connector_id: connectors.erp,
      trigger_type: "schedule",
      status: "success",
      request_json: {
        exportWindowStart: "2026-03-14T00:00:00+05:30",
        exportWindowEnd: "2026-03-14T06:00:00+05:30",
        recordCount: 12,
      },
      response_json: {
        batchId: "ERP-20260314-0600",
        accepted: 12,
        rejected: 0,
      },
      duration_ms: 1832,
      started_at: "2026-03-14T06:00:00+05:30",
      completed_at: "2026-03-14T06:00:02+05:30",
    },
    {
      id: connectorRuns.nms,
      tenant_id: tenantId,
      connector_id: connectors.nms,
      trigger_type: "webhook",
      status: "success",
      request_json: { source: "SolarWinds", element: "NVM-OLT-03" },
      response_json: { ticketCreated: "TT-2026-0314", workflowStarted: true },
      duration_ms: 742,
      started_at: "2026-03-14T07:42:00+05:30",
      completed_at: "2026-03-14T07:42:01+05:30",
    },
    {
      id: connectorRuns.payment,
      tenant_id: tenantId,
      connector_id: connectors.payment,
      trigger_type: "event",
      status: "success",
      request_json: {
        eventType: "payment.captured",
        invoiceNumber: "INV-2026-02-1841",
      },
      response_json: { ledgerReference: "RCPT-20260308-50150" },
      duration_ms: 911,
      started_at: "2026-03-08T11:40:00+05:30",
      completed_at: "2026-03-08T11:40:01+05:30",
    },
  ]);

  return {
    tenantId,
    demoLogins: {
      admin: {
        email: `admin@${tenantSlug}.example`,
        password: demoPassword(tenantSlug),
      },
      inventoryManager: {
        email: `ops.manager@${tenantSlug}.example`,
        password: demoPassword(tenantSlug),
      },
      customer: {
        email: "priya.sharma@northstarlogistics.example",
        password: demoPassword(tenantSlug),
      },
    },
    seeded: {
      customers: 3,
      products: 4,
      orders: 3,
      invoices: 3,
      networkElements: 3,
      connectors: 3,
      documents: 3,
      notifications: 3,
    },
  };
}
