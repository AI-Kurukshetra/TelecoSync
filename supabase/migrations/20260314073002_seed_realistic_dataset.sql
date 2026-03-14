ALTER TABLE tenants DISABLE TRIGGER USER;

DELETE FROM audit_logs
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM tenants
WHERE id = '11111111-1111-1111-1111-111111111111';

INSERT INTO tenants (id, name, slug, plan, status, config_json)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'AstraTel Networks',
  'astratel-networks',
  'enterprise',
  'active',
  '{
    "timezone": "Asia/Kolkata",
    "region": "West India",
    "default_currency": "INR",
    "billing_close_day": 28,
    "primary_noc": "Mumbai Core NOC"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  config_json = EXCLUDED.config_json;

ALTER TABLE tenants ENABLE TRIGGER USER;

INSERT INTO roles (id, tenant_id, name, permissions_json)
VALUES
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'platform_admin',
    '{"customers":["read","write"],"products":["read","write"],"orders":["read","write"],"billing":["read","write"],"revenue":["read","write"],"operations":["read","write"],"admin":["read","write"]}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'operations_manager',
    '{"operations":["read","write"],"inventory":["read","write"],"faults":["read","write"],"workflows":["read","write"],"notifications":["read","write"]}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'finance_controller',
    '{"billing":["read","write"],"revenue":["read","write"],"reports":["read","write"],"documents":["read","write"]}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  permissions_json = EXCLUDED.permissions_json;

INSERT INTO locations (id, tenant_id, name, address, city, country, coordinates)
VALUES
  (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'Mumbai Core NOC',
    '5th Floor, BKC One, Bandra Kurla Complex',
    'Mumbai',
    'IN',
    POINT(72.8698, 19.0607)
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    'Pune Edge POP',
    'Plot 14, Hinjawadi Phase 2',
    'Pune',
    'IN',
    POINT(73.7381, 18.5912)
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Navi Mumbai Aggregation Hub',
    'TTC Industrial Area, Mahape',
    'Navi Mumbai',
    'IN',
    POINT(73.0268, 19.1176)
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  coordinates = EXCLUDED.coordinates;

INSERT INTO customers (id, tenant_id, account_number, first_name, last_name, email, phone, address_json, status)
VALUES
  (
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    'ENT-MUM-24001',
    'Priya',
    'Sharma',
    'priya.sharma@northstarlogistics.in',
    '+91-98710-22001',
    '{"company":"NorthStar Logistics Pvt Ltd","line1":"Unit 201, Marathon Futurex","city":"Mumbai","state":"Maharashtra","postalCode":"400013","country":"IN"}'::jsonb,
    'active'
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    'ENT-PUN-24007',
    'Rahul',
    'Menon',
    'rahul.menon@meridiandigital.co.in',
    '+91-98190-34002',
    '{"company":"Meridian Digital Services","line1":"Tower B, EON Free Zone","city":"Pune","state":"Maharashtra","postalCode":"411014","country":"IN"}'::jsonb,
    'active'
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    '11111111-1111-1111-1111-111111111111',
    'ENT-NVM-24013',
    'Asha',
    'Kulkarni',
    'asha.kulkarni@seahavenhospitals.com',
    '+91-99201-77003',
    '{"company":"SeaHaven Hospitals","line1":"Palm Beach Road","city":"Navi Mumbai","state":"Maharashtra","postalCode":"400706","country":"IN"}'::jsonb,
    'active'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  account_number = EXCLUDED.account_number,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address_json = EXCLUDED.address_json,
  status = EXCLUDED.status;

INSERT INTO accounts (id, tenant_id, customer_id, account_type, status, credit_limit, balance, currency)
VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    'enterprise',
    'active',
    150000,
    24850,
    'INR'
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    'mid_market',
    'active',
    95000,
    11640,
    'INR'
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444443',
    'enterprise',
    'active',
    180000,
    0,
    'INR'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  customer_id = EXCLUDED.customer_id,
  account_type = EXCLUDED.account_type,
  status = EXCLUDED.status,
  credit_limit = EXCLUDED.credit_limit,
  balance = EXCLUDED.balance,
  currency = EXCLUDED.currency;

INSERT INTO products (id, tenant_id, name, description, category, price, currency, billing_cycle, lifecycle_status, version, valid_from, metadata_json)
VALUES
  (
    '66666666-6666-6666-6666-666666666661',
    '11111111-1111-1111-1111-111111111111',
    'Metro Ethernet 1 Gbps',
    'Dedicated Layer 2 enterprise connectivity with 99.95% uptime commitment.',
    'connectivity',
    42500,
    'INR',
    'monthly',
    'Active',
    '2026.1',
    TIMESTAMPTZ '2026-01-01 00:00:00+05:30',
    '{"serviceClass":"gold","tmfService":"TMF638","accessType":"fiber"}'::jsonb
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '11111111-1111-1111-1111-111111111111',
    'Managed SD-WAN Branch',
    'Managed branch edge with dual-underlay routing, analytics, and policy controls.',
    'managed_network',
    28600,
    'INR',
    'monthly',
    'Active',
    '2026.2',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    '{"serviceClass":"silver","deviceIncluded":true,"overlay":"sd-wan"}'::jsonb
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    '11111111-1111-1111-1111-111111111111',
    'SIP Trunk 120 Channels',
    'Enterprise SIP trunk bundle for contact center and HQ voice workloads.',
    'voice',
    19800,
    'INR',
    'monthly',
    'Active',
    '2026.1',
    TIMESTAMPTZ '2026-01-15 00:00:00+05:30',
    '{"serviceClass":"business","channels":120,"codec":"G.711"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  billing_cycle = EXCLUDED.billing_cycle,
  lifecycle_status = EXCLUDED.lifecycle_status,
  version = EXCLUDED.version,
  valid_from = EXCLUDED.valid_from,
  metadata_json = EXCLUDED.metadata_json;

INSERT INTO vendors (id, tenant_id, name, type, contact_json)
VALUES
  (
    '77777777-7777-7777-7777-777777777771',
    '11111111-1111-1111-1111-111111111111',
    'Nokia',
    'network_equipment',
    '{"contact":"Enterprise Support Desk","email":"support.india@nokia.com","phone":"+91-22-4000-1000"}'::jsonb
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '11111111-1111-1111-1111-111111111111',
    'Cisco',
    'network_equipment',
    '{"contact":"Service Provider Team","email":"sp-support-india@cisco.com","phone":"+91-80-4426-0000"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  contact_json = EXCLUDED.contact_json;

INSERT INTO network_elements (id, tenant_id, name, type, vendor_id, model, serial_number, ip_address, location_id, status, commissioned_at, metadata_json)
VALUES
  (
    '88888888-8888-8888-8888-888888888881',
    '11111111-1111-1111-1111-111111111111',
    'MUM-PE-01',
    'provider_edge',
    '77777777-7777-7777-7777-777777777771',
    '7750 SR-7',
    'NSR7-MUM-2401',
    '10.60.1.10',
    '33333333-3333-3333-3333-333333333331',
    'active',
    TIMESTAMPTZ '2025-11-18 09:30:00+05:30',
    '{"role":"core-routing","rack":"MUM-CR1","power":"dual"}'::jsonb
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    '11111111-1111-1111-1111-111111111111',
    'PUN-SDWAN-EDGE-02',
    'sdwan_edge',
    '77777777-7777-7777-7777-777777777772',
    'Catalyst 8500',
    'C8500-PUN-117',
    '10.60.18.22',
    '33333333-3333-3333-3333-333333333332',
    'active',
    TIMESTAMPTZ '2025-12-09 14:00:00+05:30',
    '{"role":"branch-aggregation","rack":"PUN-BR2","license":"dna-adv"}'::jsonb
  ),
  (
    '88888888-8888-8888-8888-888888888883',
    '11111111-1111-1111-1111-111111111111',
    'NVM-OLT-03',
    'olt',
    '77777777-7777-7777-7777-777777777771',
    'ISAM FX-16',
    'OLT-NVM-903',
    '10.60.32.14',
    '33333333-3333-3333-3333-333333333333',
    'degraded',
    TIMESTAMPTZ '2025-10-22 10:15:00+05:30',
    '{"role":"fiber-access","rack":"NVM-OLT3","ponPorts":16}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  vendor_id = EXCLUDED.vendor_id,
  model = EXCLUDED.model,
  serial_number = EXCLUDED.serial_number,
  ip_address = EXCLUDED.ip_address,
  location_id = EXCLUDED.location_id,
  status = EXCLUDED.status,
  commissioned_at = EXCLUDED.commissioned_at,
  metadata_json = EXCLUDED.metadata_json;

INSERT INTO network_interfaces (id, tenant_id, network_element_id, interface_name, type, bandwidth_mbps, status)
VALUES
  (
    '99999999-9999-9999-9999-999999999991',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888881',
    'ge-1/1/0',
    'uplink',
    10000,
    'active'
  ),
  (
    '99999999-9999-9999-9999-999999999992',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888881',
    'ge-1/1/1',
    'customer_handoff',
    1000,
    'active'
  ),
  (
    '99999999-9999-9999-9999-999999999993',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888882',
    'wan0',
    'transport',
    2000,
    'active'
  ),
  (
    '99999999-9999-9999-9999-999999999994',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888883',
    'pon-1/7',
    'access',
    2500,
    'degraded'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  network_element_id = EXCLUDED.network_element_id,
  interface_name = EXCLUDED.interface_name,
  type = EXCLUDED.type,
  bandwidth_mbps = EXCLUDED.bandwidth_mbps,
  status = EXCLUDED.status;

INSERT INTO service_instances (id, tenant_id, customer_id, product_id, network_element_id, status, activated_at, config_json)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '66666666-6666-6666-6666-666666666661',
    '88888888-8888-8888-8888-888888888881',
    'active',
    TIMESTAMPTZ '2026-01-09 11:00:00+05:30',
    '{"circuitId":"MUM-NSL-1001","vlan":2201,"qos":"gold"}'::jsonb
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    '66666666-6666-6666-6666-666666666662',
    '88888888-8888-8888-8888-888888888882',
    'active',
    TIMESTAMPTZ '2026-02-03 15:30:00+05:30',
    '{"siteCode":"PUN-MDS-HQ","policyPack":"branch-standard","underlay":["fiber","4g"]}'::jsonb
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444443',
    '66666666-6666-6666-6666-666666666663',
    '88888888-8888-8888-8888-888888888883',
    'provisioning',
    TIMESTAMPTZ '2026-03-05 09:45:00+05:30',
    '{"didBlock":"0226100XXXX","channels":120,"carrier":"AstraVoice"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  customer_id = EXCLUDED.customer_id,
  product_id = EXCLUDED.product_id,
  network_element_id = EXCLUDED.network_element_id,
  status = EXCLUDED.status,
  activated_at = EXCLUDED.activated_at,
  config_json = EXCLUDED.config_json;

INSERT INTO assets (id, tenant_id, name, asset_type, status, location_id, assigned_to, metadata_json)
VALUES
  (
    'abababab-abab-abab-abab-ababababab01',
    '11111111-1111-1111-1111-111111111111',
    '48-Core Fiber Tray MUM-07',
    'fiber_plant',
    'active',
    '33333333-3333-3333-3333-333333333331',
    '88888888-8888-8888-8888-888888888881',
    '{"spliceCount":32,"route":"BKC-Core-West"}'::jsonb
  ),
  (
    'abababab-abab-abab-abab-ababababab02',
    '11111111-1111-1111-1111-111111111111',
    'Branch Edge Appliance PUN-02',
    'customer_premise_equipment',
    'active',
    '33333333-3333-3333-3333-333333333332',
    '88888888-8888-8888-8888-888888888882',
    '{"serial":"CPE-PUN-4432","managed":true}'::jsonb
  ),
  (
    'abababab-abab-abab-abab-ababababab03',
    '11111111-1111-1111-1111-111111111111',
    'Optics Shelf NVM-03',
    'optical_transport',
    'maintenance',
    '33333333-3333-3333-3333-333333333333',
    '88888888-8888-8888-8888-888888888883',
    '{"lastInspection":"2026-03-10","ticket":"TT-2026-0314"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  asset_type = EXCLUDED.asset_type,
  status = EXCLUDED.status,
  location_id = EXCLUDED.location_id,
  assigned_to = EXCLUDED.assigned_to,
  metadata_json = EXCLUDED.metadata_json;

INSERT INTO orders (id, tenant_id, customer_id, account_id, order_number, order_type, status, items_json, total_amount, currency, fulfilled_at)
VALUES
  (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '55555555-5555-5555-5555-555555555551',
    'SO-2026-000184',
    'new_install',
    'completed',
    '[{"productId":"66666666-6666-6666-6666-666666666661","productName":"Metro Ethernet 1 Gbps","quantity":1,"site":"Mumbai HQ"}]'::jsonb,
    42500,
    'INR',
    TIMESTAMPTZ '2026-01-09 16:20:00+05:30'
  ),
  (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b2',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    '55555555-5555-5555-5555-555555555552',
    'SO-2026-000231',
    'upgrade',
    'completed',
    '[{"productId":"66666666-6666-6666-6666-666666666662","productName":"Managed SD-WAN Branch","quantity":1,"site":"Pune Branch"}]'::jsonb,
    28600,
    'INR',
    TIMESTAMPTZ '2026-02-04 12:15:00+05:30'
  ),
  (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b3',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444443',
    '55555555-5555-5555-5555-555555555553',
    'SO-2026-000312',
    'new_install',
    'in_progress',
    '[{"productId":"66666666-6666-6666-6666-666666666663","productName":"SIP Trunk 120 Channels","quantity":1,"site":"Navi Mumbai Campus"}]'::jsonb,
    19800,
    'INR',
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  customer_id = EXCLUDED.customer_id,
  account_id = EXCLUDED.account_id,
  order_number = EXCLUDED.order_number,
  order_type = EXCLUDED.order_type,
  status = EXCLUDED.status,
  items_json = EXCLUDED.items_json,
  total_amount = EXCLUDED.total_amount,
  currency = EXCLUDED.currency,
  fulfilled_at = EXCLUDED.fulfilled_at;

INSERT INTO invoices (id, tenant_id, account_id, invoice_number, billing_period_start, billing_period_end, subtotal, tax, total, status, due_date, paid_at)
VALUES
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    'INV-2026-02-1841',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    42500,
    7650,
    50150,
    'paid',
    DATE '2026-03-10',
    TIMESTAMPTZ '2026-03-08 11:40:00+05:30'
  ),
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c2',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555552',
    'INV-2026-02-2317',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    28600,
    5148,
    33748,
    'issued',
    DATE '2026-03-15',
    NULL
  ),
  (
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c3',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555553',
    'INV-2026-03-1184',
    TIMESTAMPTZ '2026-03-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-03-31 23:59:59+05:30',
    19800,
    3564,
    23364,
    'draft',
    DATE '2026-04-12',
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  account_id = EXCLUDED.account_id,
  invoice_number = EXCLUDED.invoice_number,
  billing_period_start = EXCLUDED.billing_period_start,
  billing_period_end = EXCLUDED.billing_period_end,
  subtotal = EXCLUDED.subtotal,
  tax = EXCLUDED.tax,
  total = EXCLUDED.total,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date,
  paid_at = EXCLUDED.paid_at;

INSERT INTO payments (id, tenant_id, invoice_id, amount, currency, method, status, gateway_reference, paid_at)
VALUES
  (
    'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
    '11111111-1111-1111-1111-111111111111',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    50150,
    'INR',
    'bank_transfer',
    'captured',
    'HDFC-UTR-20260308-1841',
    TIMESTAMPTZ '2026-03-08 11:40:00+05:30'
  ),
  (
    'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d2',
    '11111111-1111-1111-1111-111111111111',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c2',
    15000,
    'INR',
    'upi',
    'pending_settlement',
    'UPI-AXIS-20260313-7721',
    TIMESTAMPTZ '2026-03-13 18:12:00+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  invoice_id = EXCLUDED.invoice_id,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  method = EXCLUDED.method,
  status = EXCLUDED.status,
  gateway_reference = EXCLUDED.gateway_reference,
  paid_at = EXCLUDED.paid_at;

INSERT INTO usage_records (id, tenant_id, account_id, service_instance_id, usage_type, quantity, unit, rated_amount, recorded_at)
VALUES
  (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'throughput_commitment',
    1000,
    'Mbps',
    42500,
    TIMESTAMPTZ '2026-02-28 23:00:00+05:30'
  ),
  (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e2',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555552',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'branch_bandwidth',
    842.75,
    'GB',
    28600,
    TIMESTAMPTZ '2026-03-12 22:30:00+05:30'
  ),
  (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e3',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555553',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'voice_channels_reserved',
    120,
    'channels',
    19800,
    TIMESTAMPTZ '2026-03-13 09:00:00+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  account_id = EXCLUDED.account_id,
  service_instance_id = EXCLUDED.service_instance_id,
  usage_type = EXCLUDED.usage_type,
  quantity = EXCLUDED.quantity,
  unit = EXCLUDED.unit,
  rated_amount = EXCLUDED.rated_amount,
  recorded_at = EXCLUDED.recorded_at;

INSERT INTO performance_metrics (id, tenant_id, network_element_id, metric_type, value, unit, recorded_at)
VALUES
  (
    'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888881',
    'uptime',
    99.982,
    'pct',
    TIMESTAMPTZ '2026-03-14 08:00:00+05:30'
  ),
  (
    'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f2',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888881',
    'latency',
    4.8,
    'ms',
    TIMESTAMPTZ '2026-03-14 08:00:00+05:30'
  ),
  (
    'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f3',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888882',
    'packet_loss',
    0.03,
    'pct',
    TIMESTAMPTZ '2026-03-14 08:00:00+05:30'
  ),
  (
    'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f4',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888883',
    'temperature',
    41.2,
    'celsius',
    TIMESTAMPTZ '2026-03-14 08:00:00+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  network_element_id = EXCLUDED.network_element_id,
  metric_type = EXCLUDED.metric_type,
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  recorded_at = EXCLUDED.recorded_at;

INSERT INTO trouble_tickets (id, tenant_id, ticket_number, title, description, severity, status, network_element_id, service_instance_id, resolved_at)
VALUES
  (
    '12121212-1212-1212-1212-121212121211',
    '11111111-1111-1111-1111-111111111111',
    'TT-2026-0314',
    'High optical attenuation on access uplink',
    'Field telemetry shows elevated dBm loss on the Navi Mumbai OLT uplink affecting new voice provisioning.',
    'major',
    'open',
    '88888888-8888-8888-8888-888888888883',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    NULL
  ),
  (
    '12121212-1212-1212-1212-121212121212',
    '11111111-1111-1111-1111-111111111111',
    'TT-2026-0307',
    'Branch underlay failover observed',
    'Primary fiber underlay flapped for 96 seconds; service recovered on LTE backup and has remained stable.',
    'minor',
    'resolved',
    '88888888-8888-8888-8888-888888888882',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    TIMESTAMPTZ '2026-03-07 13:25:00+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  ticket_number = EXCLUDED.ticket_number,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  severity = EXCLUDED.severity,
  status = EXCLUDED.status,
  network_element_id = EXCLUDED.network_element_id,
  service_instance_id = EXCLUDED.service_instance_id,
  resolved_at = EXCLUDED.resolved_at;

INSERT INTO alarms (id, tenant_id, network_element_id, severity, description, source, status, raised_at, cleared_at)
VALUES
  (
    '13131313-1313-1313-1313-131313131311',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888883',
    'critical',
    'PON port utilization exceeded threshold and optical power drift crossed policy limits.',
    'NMS',
    'active',
    TIMESTAMPTZ '2026-03-14 07:42:00+05:30',
    NULL
  ),
  (
    '13131313-1313-1313-1313-131313131312',
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888882',
    'warning',
    'WAN0 underlay experienced jitter spike above 35 ms for four polling intervals.',
    'SDWAN_CONTROLLER',
    'cleared',
    TIMESTAMPTZ '2026-03-07 11:02:00+05:30',
    TIMESTAMPTZ '2026-03-07 11:10:00+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  network_element_id = EXCLUDED.network_element_id,
  severity = EXCLUDED.severity,
  description = EXCLUDED.description,
  source = EXCLUDED.source,
  status = EXCLUDED.status,
  raised_at = EXCLUDED.raised_at,
  cleared_at = EXCLUDED.cleared_at;

INSERT INTO workflows (id, tenant_id, name, trigger_type, steps_json, status, version)
VALUES
  (
    '14141414-1414-1414-1414-141414141411',
    '11111111-1111-1111-1111-111111111111',
    'Enterprise service activation',
    'order.completed',
    '[{"step":"validate_order","owner":"orchestration"},{"step":"reserve_capacity","owner":"network-ops"},{"step":"notify_customer","owner":"service-desk"}]'::jsonb,
    'active',
    3
  ),
  (
    '14141414-1414-1414-1414-141414141412',
    '11111111-1111-1111-1111-111111111111',
    'Critical alarm escalation',
    'alarm.raised',
    '[{"step":"create_ticket","owner":"noc"},{"step":"page_field_team","owner":"field-ops"},{"step":"send_customer_advisory","owner":"customer-success"}]'::jsonb,
    'active',
    2
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  trigger_type = EXCLUDED.trigger_type,
  steps_json = EXCLUDED.steps_json,
  status = EXCLUDED.status,
  version = EXCLUDED.version;

INSERT INTO workflow_instances (id, tenant_id, workflow_id, entity_type, entity_id, current_step, state_json, status, started_at, completed_at)
VALUES
  (
    '15151515-1515-1515-1515-151515151511',
    '11111111-1111-1111-1111-111111111111',
    '14141414-1414-1414-1414-141414141411',
    'order',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
    3,
    '{"capacityReserved":true,"customerNotified":true}'::jsonb,
    'completed',
    TIMESTAMPTZ '2026-01-09 10:30:00+05:30',
    TIMESTAMPTZ '2026-01-09 16:25:00+05:30'
  ),
  (
    '15151515-1515-1515-1515-151515151512',
    '11111111-1111-1111-1111-111111111111',
    '14141414-1414-1414-1414-141414141412',
    'alarm',
    '13131313-1313-1313-1313-131313131311',
    2,
    '{"ticketCreated":"TT-2026-0314","fieldTeamPaged":true}'::jsonb,
    'running',
    TIMESTAMPTZ '2026-03-14 07:43:00+05:30',
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  workflow_id = EXCLUDED.workflow_id,
  entity_type = EXCLUDED.entity_type,
  entity_id = EXCLUDED.entity_id,
  current_step = EXCLUDED.current_step,
  state_json = EXCLUDED.state_json,
  status = EXCLUDED.status,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at;

INSERT INTO slas (id, tenant_id, name, metric_type, target_value, measurement_window, penalty_json)
VALUES
  (
    '16161616-1616-1616-1616-161616161611',
    '11111111-1111-1111-1111-111111111111',
    'Enterprise Ethernet Gold',
    'uptime_pct',
    99.95,
    'monthly',
    '{"creditPct":7.5,"breachWindow":"30m"}'::jsonb
  ),
  (
    '16161616-1616-1616-1616-161616161612',
    '11111111-1111-1111-1111-111111111111',
    'Managed SD-WAN Standard',
    'latency_ms',
    20,
    'weekly',
    '{"creditPct":3.0,"breachWindow":"15m"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  metric_type = EXCLUDED.metric_type,
  target_value = EXCLUDED.target_value,
  measurement_window = EXCLUDED.measurement_window,
  penalty_json = EXCLUDED.penalty_json;

INSERT INTO revenue_assurance_jobs (id, tenant_id, period_start, period_end, status, total_billed, total_rated, leakage_pct, completed_at)
VALUES
  (
    '17171717-1717-1717-1717-171717171711',
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    'completed',
    83898,
    85250,
    1.6126,
    TIMESTAMPTZ '2026-03-03 06:20:00+05:30'
  ),
  (
    '17171717-1717-1717-1717-171717171712',
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMPTZ '2026-03-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-03-31 23:59:59+05:30',
    'running',
    23364,
    19800,
    -18.0000,
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  period_start = EXCLUDED.period_start,
  period_end = EXCLUDED.period_end,
  status = EXCLUDED.status,
  total_billed = EXCLUDED.total_billed,
  total_rated = EXCLUDED.total_rated,
  leakage_pct = EXCLUDED.leakage_pct,
  completed_at = EXCLUDED.completed_at;

INSERT INTO reconciliation_runs (id, tenant_id, period_start, period_end, status, gross_revenue, adjustments, approved_at, notes)
VALUES
  (
    '18181818-1818-1818-1818-181818181811',
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    'approved',
    83898,
    -1250,
    TIMESTAMPTZ '2026-03-05 17:10:00+05:30',
    'Credit note issued for branch failover incident lasting 96 seconds.'
  ),
  (
    '18181818-1818-1818-1818-181818181812',
    '11111111-1111-1111-1111-111111111111',
    TIMESTAMPTZ '2026-03-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-03-31 23:59:59+05:30',
    'draft',
    23364,
    0,
    NULL,
    'March close remains open pending SIP trunk activation milestone.'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  period_start = EXCLUDED.period_start,
  period_end = EXCLUDED.period_end,
  status = EXCLUDED.status,
  gross_revenue = EXCLUDED.gross_revenue,
  adjustments = EXCLUDED.adjustments,
  approved_at = EXCLUDED.approved_at,
  notes = EXCLUDED.notes;

INSERT INTO settlement_statements (id, tenant_id, partner_id, partner_type, period_start, period_end, direction, gross_amount, tax_amount, net_amount, currency, status, due_date, paid_at)
VALUES
  (
    '19191919-1919-1919-1919-191919191911',
    '11111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777771',
    'vendor',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    'payable',
    420000,
    75600,
    495600,
    'INR',
    'approved',
    DATE '2026-03-25',
    NULL
  ),
  (
    '19191919-1919-1919-1919-191919191912',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    'customer',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    'receivable',
    42500,
    7650,
    50150,
    'INR',
    'received',
    DATE '2026-03-10',
    TIMESTAMPTZ '2026-03-08 11:40:00+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  partner_id = EXCLUDED.partner_id,
  partner_type = EXCLUDED.partner_type,
  period_start = EXCLUDED.period_start,
  period_end = EXCLUDED.period_end,
  direction = EXCLUDED.direction,
  gross_amount = EXCLUDED.gross_amount,
  tax_amount = EXCLUDED.tax_amount,
  net_amount = EXCLUDED.net_amount,
  currency = EXCLUDED.currency,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date,
  paid_at = EXCLUDED.paid_at;

INSERT INTO financial_reports (id, tenant_id, report_type, period_start, period_end, payload_json)
VALUES
  (
    '20202020-2020-2020-2020-202020202021',
    '11111111-1111-1111-1111-111111111111',
    'monthly_margin',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    '{"grossRevenue":83898,"networkCost":420000,"creditNotes":1250,"marginPct":18.4}'::jsonb
  ),
  (
    '20202020-2020-2020-2020-202020202022',
    '11111111-1111-1111-1111-111111111111',
    'collections_snapshot',
    TIMESTAMPTZ '2026-03-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-03-14 23:59:59+05:30',
    '{"current":50150,"overdue_0_30":33748,"overdue_31_60":0,"unbilled":23364}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  report_type = EXCLUDED.report_type,
  period_start = EXCLUDED.period_start,
  period_end = EXCLUDED.period_end,
  payload_json = EXCLUDED.payload_json;

INSERT INTO api_registry (id, tenant_id, name, slug, version, standard, base_url, spec_url, auth_type, status, owner_team)
VALUES
  (
    '21212121-2121-2121-2121-212121212121',
    '11111111-1111-1111-1111-111111111111',
    'Product Catalog API',
    'product-catalog',
    'v4',
    'TMF620',
    'https://api.astratel.net/catalog',
    'https://developer.astratel.net/apis/catalog/v4/openapi.yaml',
    'bearer',
    'active',
    'Digital Commerce'
  ),
  (
    '21212121-2121-2121-2121-212121212122',
    '11111111-1111-1111-1111-111111111111',
    'Order Orchestration API',
    'order-orchestration',
    'v4',
    'TMF622',
    'https://api.astratel.net/orders',
    'https://developer.astratel.net/apis/orders/v4/openapi.yaml',
    'bearer',
    'active',
    'Service Fulfilment'
  ),
  (
    '21212121-2121-2121-2121-212121212123',
    '11111111-1111-1111-1111-111111111111',
    'Service Inventory API',
    'service-inventory',
    'v4',
    'TMF638',
    'https://api.astratel.net/service-inventory',
    'https://developer.astratel.net/apis/service-inventory/v4/openapi.yaml',
    'bearer',
    'active',
    'Operations Engineering'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  version = EXCLUDED.version,
  standard = EXCLUDED.standard,
  base_url = EXCLUDED.base_url,
  spec_url = EXCLUDED.spec_url,
  auth_type = EXCLUDED.auth_type,
  status = EXCLUDED.status,
  owner_team = EXCLUDED.owner_team;

INSERT INTO webhook_subscriptions (id, tenant_id, name, target_url, secret, event_types, headers_json, enabled)
VALUES
  (
    '23232323-2323-2323-2323-232323232321',
    '11111111-1111-1111-1111-111111111111',
    'Finance Ledger Sink',
    'https://ledger.astratel.net/hooks/invoices',
    'astratel-ledger-hook-2026-001',
    ARRAY['invoice.generated', 'payment.captured', 'settlement.approved'],
    '{"x-partner":"finance-ledger","x-source":"telecosync"}'::jsonb,
    true
  ),
  (
    '23232323-2323-2323-2323-232323232322',
    '11111111-1111-1111-1111-111111111111',
    'NOC Event Stream',
    'https://noc.astratel.net/hooks/events',
    'astratel-noc-hook-2026-009',
    ARRAY['alarm.raised', 'ticket.created', 'workflow.started'],
    '{"x-team":"noc","x-priority":"high"}'::jsonb,
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  target_url = EXCLUDED.target_url,
  secret = EXCLUDED.secret,
  event_types = EXCLUDED.event_types,
  headers_json = EXCLUDED.headers_json,
  enabled = EXCLUDED.enabled;

INSERT INTO webhook_deliveries (id, tenant_id, subscription_id, event_type, payload_json, http_status, response_body, attempt_number, status, delivered_at)
VALUES
  (
    '24242424-2424-2424-2424-242424242421',
    '11111111-1111-1111-1111-111111111111',
    '23232323-2323-2323-2323-232323232321',
    'payment.captured',
    '{"invoiceId":"c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1","amount":50150,"currency":"INR"}'::jsonb,
    200,
    '{"status":"accepted"}',
    1,
    'delivered',
    TIMESTAMPTZ '2026-03-08 11:41:05+05:30'
  ),
  (
    '24242424-2424-2424-2424-242424242422',
    '11111111-1111-1111-1111-111111111111',
    '23232323-2323-2323-2323-232323232322',
    'alarm.raised',
    '{"alarmId":"13131313-1313-1313-1313-131313131311","severity":"critical"}'::jsonb,
    202,
    '{"queued":true}',
    1,
    'delivered',
    TIMESTAMPTZ '2026-03-14 07:43:03+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  subscription_id = EXCLUDED.subscription_id,
  event_type = EXCLUDED.event_type,
  payload_json = EXCLUDED.payload_json,
  http_status = EXCLUDED.http_status,
  response_body = EXCLUDED.response_body,
  attempt_number = EXCLUDED.attempt_number,
  status = EXCLUDED.status,
  delivered_at = EXCLUDED.delivered_at;

INSERT INTO event_log (id, tenant_id, event_type, entity_type, entity_id, payload_json, source_service, fired_at, processed, processed_at)
VALUES
  (
    '25252525-2525-2525-2525-252525252521',
    '11111111-1111-1111-1111-111111111111',
    'invoice.generated',
    'invoice',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c2',
    '{"invoiceNumber":"INV-2026-02-2317","total":33748}'::jsonb,
    'billing-engine',
    TIMESTAMPTZ '2026-03-01 06:00:00+05:30',
    true,
    TIMESTAMPTZ '2026-03-01 06:00:02+05:30'
  ),
  (
    '25252525-2525-2525-2525-252525252522',
    '11111111-1111-1111-1111-111111111111',
    'payment.captured',
    'payment',
    'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
    '{"invoiceId":"c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1","amount":50150}'::jsonb,
    'payments-gateway',
    TIMESTAMPTZ '2026-03-08 11:40:00+05:30',
    true,
    TIMESTAMPTZ '2026-03-08 11:40:04+05:30'
  ),
  (
    '25252525-2525-2525-2525-252525252523',
    '11111111-1111-1111-1111-111111111111',
    'alarm.raised',
    'alarm',
    '13131313-1313-1313-1313-131313131311',
    '{"severity":"critical","element":"NVM-OLT-03"}'::jsonb,
    'nms-ingest',
    TIMESTAMPTZ '2026-03-14 07:42:00+05:30',
    false,
    NULL
  ),
  (
    '25252525-2525-2525-2525-252525252524',
    '11111111-1111-1111-1111-111111111111',
    'workflow.started',
    'workflow_instance',
    '15151515-1515-1515-1515-151515151512',
    '{"workflow":"Critical alarm escalation","alarmId":"13131313-1313-1313-1313-131313131311"}'::jsonb,
    'workflow-engine',
    TIMESTAMPTZ '2026-03-14 07:43:00+05:30',
    false,
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  event_type = EXCLUDED.event_type,
  entity_type = EXCLUDED.entity_type,
  entity_id = EXCLUDED.entity_id,
  payload_json = EXCLUDED.payload_json,
  source_service = EXCLUDED.source_service,
  fired_at = EXCLUDED.fired_at,
  processed = EXCLUDED.processed,
  processed_at = EXCLUDED.processed_at;

INSERT INTO notifications (id, tenant_id, user_id, channel, title, body, status, sent_at, read_at)
VALUES
  (
    '26262626-2626-2626-2626-262626262621',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'email',
    'Invoice INV-2026-02-2317 issued',
    'February managed SD-WAN charges for Meridian Digital Services are ready for customer delivery.',
    'sent',
    TIMESTAMPTZ '2026-03-01 06:05:00+05:30',
    NULL
  ),
  (
    '26262626-2626-2626-2626-262626262622',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'sms',
    'Critical alarm on NVM-OLT-03',
    'Optical power drift detected at Navi Mumbai access node. Ticket TT-2026-0314 is active.',
    'sent',
    TIMESTAMPTZ '2026-03-14 07:44:00+05:30',
    NULL
  ),
  (
    '26262626-2626-2626-2626-262626262623',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'in_app',
    'Collections update received',
    'NorthStar Logistics payment posted against February invoice and settlement ledger updated.',
    'read',
    TIMESTAMPTZ '2026-03-08 11:45:00+05:30',
    TIMESTAMPTZ '2026-03-08 12:10:00+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  user_id = EXCLUDED.user_id,
  channel = EXCLUDED.channel,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  status = EXCLUDED.status,
  sent_at = EXCLUDED.sent_at,
  read_at = EXCLUDED.read_at;

INSERT INTO documents (id, tenant_id, entity_type, entity_id, name, storage_path, mime_type, size_bytes, uploaded_by)
VALUES
  (
    '27272727-2727-2727-2727-272727272721',
    '11111111-1111-1111-1111-111111111111',
    'invoice',
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
    'northstar-feb-2026-invoice.pdf',
    'billing/invoices/2026/02/northstar-feb-2026-invoice.pdf',
    'application/pdf',
    248932,
    NULL
  ),
  (
    '27272727-2727-2727-2727-272727272722',
    '11111111-1111-1111-1111-111111111111',
    'network_element',
    '88888888-8888-8888-8888-888888888883',
    'nvm-olt-03-maintenance-record.xlsx',
    'operations/maintenance/nvm-olt-03-maintenance-record.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    183420,
    NULL
  ),
  (
    '27272727-2727-2727-2727-272727272723',
    '11111111-1111-1111-1111-111111111111',
    'order',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b3',
    'seahaven-sip-design-pack.pdf',
    'service/orders/2026/03/seahaven-sip-design-pack.pdf',
    'application/pdf',
    529104,
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  entity_type = EXCLUDED.entity_type,
  entity_id = EXCLUDED.entity_id,
  name = EXCLUDED.name,
  storage_path = EXCLUDED.storage_path,
  mime_type = EXCLUDED.mime_type,
  size_bytes = EXCLUDED.size_bytes,
  uploaded_by = EXCLUDED.uploaded_by;

INSERT INTO integration_connectors (id, tenant_id, name, connector_type, direction, system_type, config_json, enabled, last_run_at, last_run_status)
VALUES
  (
    '28282828-2828-2828-2828-282828282821',
    '11111111-1111-1111-1111-111111111111',
    'Oracle ERP Billing Export',
    'rest',
    'outbound',
    'erp',
    '{"endpoint":"https://erp.astratel.net/api/v1/billing/export","method":"POST","schedule":"0 */6 * * *","authProfile":"erp_service_account"}'::jsonb,
    true,
    TIMESTAMPTZ '2026-03-14 06:00:00+05:30',
    'success'
  ),
  (
    '28282828-2828-2828-2828-282828282822',
    '11111111-1111-1111-1111-111111111111',
    'SolarWinds NMS Alarm Ingest',
    'rest',
    'inbound',
    'nms',
    '{"endpoint":"https://nms.astratel.net/events/alarms","method":"POST","validation":"hmac-sha256"}'::jsonb,
    true,
    TIMESTAMPTZ '2026-03-14 07:42:00+05:30',
    'success'
  ),
  (
    '28282828-2828-2828-2828-282828282823',
    '11111111-1111-1111-1111-111111111111',
    'Razorpay Collections Feed',
    'rest',
    'bidirectional',
    'payment',
    '{"endpoint":"https://payments.astratel.net/collections/razorpay","method":"POST","retryPolicy":"exponential"}'::jsonb,
    true,
    TIMESTAMPTZ '2026-03-13 18:12:00+05:30',
    'success'
  ),
  (
    '28282828-2828-2828-2828-282828282824',
    '11111111-1111-1111-1111-111111111111',
    'Salesforce Enterprise CRM Sync',
    'rest',
    'bidirectional',
    'crm',
    '{"endpoint":"https://crm.astratel.net/api/accounts","object":"Account","syncWindow":"15m"}'::jsonb,
    true,
    TIMESTAMPTZ '2026-03-14 05:45:00+05:30',
    'success'
  ),
  (
    '28282828-2828-2828-2828-282828282825',
    '11111111-1111-1111-1111-111111111111',
    'TM Forum API Gateway',
    'custom',
    'bidirectional',
    'tmf',
    '{"baseUrl":"https://api.astratel.net","standards":["TMF620","TMF622","TMF638"],"tenantRouting":"header"}'::jsonb,
    true,
    TIMESTAMPTZ '2026-03-14 04:30:00+05:30',
    'success'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  connector_type = EXCLUDED.connector_type,
  direction = EXCLUDED.direction,
  system_type = EXCLUDED.system_type,
  config_json = EXCLUDED.config_json,
  enabled = EXCLUDED.enabled,
  last_run_at = EXCLUDED.last_run_at,
  last_run_status = EXCLUDED.last_run_status;

INSERT INTO connector_executions (id, tenant_id, connector_id, trigger_type, status, request_json, response_json, error_message, duration_ms, started_at, completed_at)
VALUES
  (
    '29292929-2929-2929-2929-292929292921',
    '11111111-1111-1111-1111-111111111111',
    '28282828-2828-2828-2828-282828282821',
    'schedule',
    'success',
    '{"exportWindowStart":"2026-03-14T00:00:00+05:30","exportWindowEnd":"2026-03-14T06:00:00+05:30","recordCount":12}'::jsonb,
    '{"batchId":"ERP-20260314-0600","accepted":12,"rejected":0}'::jsonb,
    NULL,
    1832,
    TIMESTAMPTZ '2026-03-14 06:00:00+05:30',
    TIMESTAMPTZ '2026-03-14 06:00:02+05:30'
  ),
  (
    '29292929-2929-2929-2929-292929292922',
    '11111111-1111-1111-1111-111111111111',
    '28282828-2828-2828-2828-282828282822',
    'webhook',
    'success',
    '{"source":"SolarWinds","alarmId":"13131313-1313-1313-1313-131313131311"}'::jsonb,
    '{"ticketCreated":"TT-2026-0314","workflowStarted":true}'::jsonb,
    NULL,
    742,
    TIMESTAMPTZ '2026-03-14 07:42:00+05:30',
    TIMESTAMPTZ '2026-03-14 07:42:01+05:30'
  ),
  (
    '29292929-2929-2929-2929-292929292923',
    '11111111-1111-1111-1111-111111111111',
    '28282828-2828-2828-2828-282828282823',
    'event',
    'success',
    '{"eventType":"payment.captured","paymentId":"d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1"}'::jsonb,
    '{"ledgerReference":"RCPT-20260308-50150"}'::jsonb,
    NULL,
    911,
    TIMESTAMPTZ '2026-03-08 11:40:00+05:30',
    TIMESTAMPTZ '2026-03-08 11:40:01+05:30'
  )
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  connector_id = EXCLUDED.connector_id,
  trigger_type = EXCLUDED.trigger_type,
  status = EXCLUDED.status,
  request_json = EXCLUDED.request_json,
  response_json = EXCLUDED.response_json,
  error_message = EXCLUDED.error_message,
  duration_ms = EXCLUDED.duration_ms,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at;
