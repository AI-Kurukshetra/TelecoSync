DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'tenants',
    'roles',
    'locations',
    'customers',
    'accounts',
    'products',
    'vendors',
    'network_elements',
    'network_interfaces',
    'service_instances',
    'assets',
    'orders',
    'invoices',
    'payments',
    'usage_records',
    'performance_metrics',
    'trouble_tickets',
    'alarms',
    'workflows',
    'workflow_instances',
    'slas',
    'revenue_assurance_jobs',
    'reconciliation_runs',
    'settlement_statements',
    'financial_reports',
    'api_registry',
    'webhook_subscriptions',
    'webhook_deliveries',
    'event_log',
    'notifications',
    'documents',
    'integration_connectors',
    'connector_executions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE TRIGGER USER', table_name);
  END LOOP;
END
$$;

DELETE FROM audit_logs
WHERE tenant_id IN (
  SELECT id FROM tenants WHERE slug = 'astratel-networks'
);

DELETE FROM tenants
WHERE slug = 'astratel-networks';

INSERT INTO tenants (name, slug, plan, status, config_json)
VALUES (
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
);

INSERT INTO roles (tenant_id, name, permissions_json)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'platform_admin',
    '{"customers":["read","write"],"products":["read","write"],"orders":["read","write"],"billing":["read","write"],"revenue":["read","write"],"operations":["read","write"],"admin":["read","write"]}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'operations_manager',
    '{"operations":["read","write"],"inventory":["read","write"],"faults":["read","write"],"workflows":["read","write"],"notifications":["read","write"]}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'finance_controller',
    '{"billing":["read","write"],"revenue":["read","write"],"reports":["read","write"],"documents":["read","write"]}'::jsonb
  );

INSERT INTO locations (tenant_id, name, address, city, country, coordinates)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Mumbai Core NOC',
    '5th Floor, BKC One, Bandra Kurla Complex',
    'Mumbai',
    'IN',
    POINT(72.8698, 19.0607)
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Pune Edge POP',
    'Plot 14, Hinjawadi Phase 2',
    'Pune',
    'IN',
    POINT(73.7381, 18.5912)
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Navi Mumbai Aggregation Hub',
    'TTC Industrial Area, Mahape',
    'Navi Mumbai',
    'IN',
    POINT(73.0268, 19.1176)
  );

INSERT INTO customers (tenant_id, account_number, first_name, last_name, email, phone, address_json, status)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'ENT-MUM-24001',
    'Priya',
    'Sharma',
    'priya.sharma@northstarlogistics.in',
    '+91-98710-22001',
    '{"company":"NorthStar Logistics Pvt Ltd","line1":"Unit 201, Marathon Futurex","city":"Mumbai","state":"Maharashtra","postalCode":"400013","country":"IN"}'::jsonb,
    'active'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'ENT-PUN-24007',
    'Rahul',
    'Menon',
    'rahul.menon@meridiandigital.co.in',
    '+91-98190-34002',
    '{"company":"Meridian Digital Services","line1":"Tower B, EON Free Zone","city":"Pune","state":"Maharashtra","postalCode":"411014","country":"IN"}'::jsonb,
    'active'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'ENT-NVM-24013',
    'Asha',
    'Kulkarni',
    'asha.kulkarni@seahavenhospitals.com',
    '+91-99201-77003',
    '{"company":"SeaHaven Hospitals","line1":"Palm Beach Road","city":"Navi Mumbai","state":"Maharashtra","postalCode":"400706","country":"IN"}'::jsonb,
    'active'
  );

INSERT INTO accounts (tenant_id, customer_id, account_type, status, credit_limit, balance, currency)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-MUM-24001'),
    'enterprise',
    'active',
    150000,
    24850,
    'INR'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-PUN-24007'),
    'mid_market',
    'active',
    95000,
    11640,
    'INR'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-NVM-24013'),
    'enterprise',
    'active',
    180000,
    0,
    'INR'
  );

INSERT INTO products (tenant_id, name, description, category, price, currency, billing_cycle, lifecycle_status, version, valid_from, metadata_json)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
  );

INSERT INTO vendors (tenant_id, name, type, contact_json)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Nokia',
    'network_equipment',
    '{"contact":"Enterprise Support Desk","email":"support.india@nokia.com","phone":"+91-22-4000-1000"}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Cisco',
    'network_equipment',
    '{"contact":"Service Provider Team","email":"sp-support-india@cisco.com","phone":"+91-80-4426-0000"}'::jsonb
  );

INSERT INTO network_elements (tenant_id, name, type, vendor_id, model, serial_number, ip_address, location_id, status, commissioned_at, metadata_json)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'MUM-PE-01',
    'provider_edge',
    (SELECT id FROM vendors WHERE name = 'Nokia'),
    '7750 SR-7',
    'NSR7-MUM-2401',
    '10.60.1.10',
    (SELECT id FROM locations WHERE name = 'Mumbai Core NOC'),
    'active',
    TIMESTAMPTZ '2025-11-18 09:30:00+05:30',
    '{"role":"core-routing","rack":"MUM-CR1","power":"dual"}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'PUN-SDWAN-EDGE-02',
    'sdwan_edge',
    (SELECT id FROM vendors WHERE name = 'Cisco'),
    'Catalyst 8500',
    'C8500-PUN-117',
    '10.60.18.22',
    (SELECT id FROM locations WHERE name = 'Pune Edge POP'),
    'active',
    TIMESTAMPTZ '2025-12-09 14:00:00+05:30',
    '{"role":"branch-aggregation","rack":"PUN-BR2","license":"dna-adv"}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'NVM-OLT-03',
    'olt',
    (SELECT id FROM vendors WHERE name = 'Nokia'),
    'ISAM FX-16',
    'OLT-NVM-903',
    '10.60.32.14',
    (SELECT id FROM locations WHERE name = 'Navi Mumbai Aggregation Hub'),
    'degraded',
    TIMESTAMPTZ '2025-10-22 10:15:00+05:30',
    '{"role":"fiber-access","rack":"NVM-OLT3","ponPorts":16}'::jsonb
  );

INSERT INTO network_interfaces (tenant_id, network_element_id, interface_name, type, bandwidth_mbps, status)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'MUM-PE-01'),
    'ge-1/1/0',
    'uplink',
    10000,
    'active'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'MUM-PE-01'),
    'ge-1/1/1',
    'customer_handoff',
    1000,
    'active'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'PUN-SDWAN-EDGE-02'),
    'wan0',
    'transport',
    2000,
    'active'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'NVM-OLT-03'),
    'pon-1/7',
    'access',
    2500,
    'degraded'
  );

INSERT INTO service_instances (tenant_id, customer_id, product_id, network_element_id, status, activated_at, config_json)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-MUM-24001'),
    (SELECT id FROM products WHERE name = 'Metro Ethernet 1 Gbps'),
    (SELECT id FROM network_elements WHERE name = 'MUM-PE-01'),
    'active',
    TIMESTAMPTZ '2026-01-09 11:00:00+05:30',
    '{"circuitId":"MUM-NSL-1001","vlan":2201,"qos":"gold"}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-PUN-24007'),
    (SELECT id FROM products WHERE name = 'Managed SD-WAN Branch'),
    (SELECT id FROM network_elements WHERE name = 'PUN-SDWAN-EDGE-02'),
    'active',
    TIMESTAMPTZ '2026-02-03 15:30:00+05:30',
    '{"siteCode":"PUN-MDS-HQ","policyPack":"branch-standard","underlay":["fiber","4g"]}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-NVM-24013'),
    (SELECT id FROM products WHERE name = 'SIP Trunk 120 Channels'),
    (SELECT id FROM network_elements WHERE name = 'NVM-OLT-03'),
    'provisioning',
    TIMESTAMPTZ '2026-03-05 09:45:00+05:30',
    '{"didBlock":"0226100XXXX","channels":120,"carrier":"AstraVoice"}'::jsonb
  );

INSERT INTO assets (tenant_id, name, asset_type, status, location_id, assigned_to, metadata_json)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    '48-Core Fiber Tray MUM-07',
    'fiber_plant',
    'active',
    (SELECT id FROM locations WHERE name = 'Mumbai Core NOC'),
    (SELECT id FROM network_elements WHERE name = 'MUM-PE-01'),
    '{"spliceCount":32,"route":"BKC-Core-West"}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Branch Edge Appliance PUN-02',
    'customer_premise_equipment',
    'active',
    (SELECT id FROM locations WHERE name = 'Pune Edge POP'),
    (SELECT id FROM network_elements WHERE name = 'PUN-SDWAN-EDGE-02'),
    '{"serial":"CPE-PUN-4432","managed":true}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Optics Shelf NVM-03',
    'optical_transport',
    'maintenance',
    (SELECT id FROM locations WHERE name = 'Navi Mumbai Aggregation Hub'),
    (SELECT id FROM network_elements WHERE name = 'NVM-OLT-03'),
    '{"lastInspection":"2026-03-10","ticket":"TT-2026-0314"}'::jsonb
  );

INSERT INTO orders (tenant_id, customer_id, account_id, order_number, order_type, status, items_json, total_amount, currency, fulfilled_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-MUM-24001'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-MUM-24001')),
    'SO-2026-000184',
    'new_install',
    'completed',
    jsonb_build_array(
      jsonb_build_object(
        'productCode', 'METRO-ETH-1G',
        'productName', 'Metro Ethernet 1 Gbps',
        'quantity', 1,
        'site', 'Mumbai HQ'
      )
    ),
    42500,
    'INR',
    TIMESTAMPTZ '2026-01-09 16:20:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-PUN-24007'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-PUN-24007')),
    'SO-2026-000231',
    'upgrade',
    'completed',
    jsonb_build_array(
      jsonb_build_object(
        'productCode', 'SDWAN-BRANCH',
        'productName', 'Managed SD-WAN Branch',
        'quantity', 1,
        'site', 'Pune Branch'
      )
    ),
    28600,
    'INR',
    TIMESTAMPTZ '2026-02-04 12:15:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-NVM-24013'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-NVM-24013')),
    'SO-2026-000312',
    'new_install',
    'in_progress',
    jsonb_build_array(
      jsonb_build_object(
        'productCode', 'SIP-120',
        'productName', 'SIP Trunk 120 Channels',
        'quantity', 1,
        'site', 'Navi Mumbai Campus'
      )
    ),
    19800,
    'INR',
    NULL
  );

INSERT INTO invoices (tenant_id, account_id, invoice_number, billing_period_start, billing_period_end, subtotal, tax, total, status, due_date, paid_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-MUM-24001')),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-PUN-24007')),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-NVM-24013')),
    'INV-2026-03-1184',
    TIMESTAMPTZ '2026-03-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-03-31 23:59:59+05:30',
    19800,
    3564,
    23364,
    'draft',
    DATE '2026-04-12',
    NULL
  );

INSERT INTO payments (tenant_id, invoice_id, amount, currency, method, status, gateway_reference, paid_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM invoices WHERE invoice_number = 'INV-2026-02-1841'),
    50150,
    'INR',
    'bank_transfer',
    'captured',
    'HDFC-UTR-20260308-1841',
    TIMESTAMPTZ '2026-03-08 11:40:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM invoices WHERE invoice_number = 'INV-2026-02-2317'),
    15000,
    'INR',
    'upi',
    'pending_settlement',
    'UPI-AXIS-20260313-7721',
    TIMESTAMPTZ '2026-03-13 18:12:00+05:30'
  );

INSERT INTO usage_records (tenant_id, account_id, service_instance_id, usage_type, quantity, unit, rated_amount, recorded_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-MUM-24001')),
    (SELECT id FROM service_instances WHERE config_json ->> 'circuitId' = 'MUM-NSL-1001'),
    'throughput_commitment',
    1000,
    'Mbps',
    42500,
    TIMESTAMPTZ '2026-02-28 23:00:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-PUN-24007')),
    (SELECT id FROM service_instances WHERE config_json ->> 'siteCode' = 'PUN-MDS-HQ'),
    'branch_bandwidth',
    842.75,
    'GB',
    28600,
    TIMESTAMPTZ '2026-03-12 22:30:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM accounts WHERE customer_id = (SELECT id FROM customers WHERE account_number = 'ENT-NVM-24013')),
    (SELECT id FROM service_instances WHERE config_json ->> 'carrier' = 'AstraVoice'),
    'voice_channels_reserved',
    120,
    'channels',
    19800,
    TIMESTAMPTZ '2026-03-13 09:00:00+05:30'
  );

INSERT INTO performance_metrics (tenant_id, network_element_id, metric_type, value, unit, recorded_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'MUM-PE-01'),
    'uptime',
    99.982,
    'pct',
    TIMESTAMPTZ '2026-03-14 08:00:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'MUM-PE-01'),
    'latency',
    4.8,
    'ms',
    TIMESTAMPTZ '2026-03-14 08:00:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'PUN-SDWAN-EDGE-02'),
    'packet_loss',
    0.03,
    'pct',
    TIMESTAMPTZ '2026-03-14 08:00:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'NVM-OLT-03'),
    'temperature',
    41.2,
    'celsius',
    TIMESTAMPTZ '2026-03-14 08:00:00+05:30'
  );

INSERT INTO trouble_tickets (tenant_id, ticket_number, title, description, severity, status, network_element_id, service_instance_id, resolved_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'TT-2026-0314',
    'High optical attenuation on access uplink',
    'Field telemetry shows elevated dBm loss on the Navi Mumbai OLT uplink affecting new voice provisioning.',
    'major',
    'open',
    (SELECT id FROM network_elements WHERE name = 'NVM-OLT-03'),
    (SELECT id FROM service_instances WHERE config_json ->> 'carrier' = 'AstraVoice'),
    NULL
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'TT-2026-0307',
    'Branch underlay failover observed',
    'Primary fiber underlay flapped for 96 seconds; service recovered on LTE backup and has remained stable.',
    'minor',
    'resolved',
    (SELECT id FROM network_elements WHERE name = 'PUN-SDWAN-EDGE-02'),
    (SELECT id FROM service_instances WHERE config_json ->> 'siteCode' = 'PUN-MDS-HQ'),
    TIMESTAMPTZ '2026-03-07 13:25:00+05:30'
  );

INSERT INTO alarms (tenant_id, network_element_id, severity, description, source, status, raised_at, cleared_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'NVM-OLT-03'),
    'critical',
    'PON port utilization exceeded threshold and optical power drift crossed policy limits.',
    'NMS',
    'active',
    TIMESTAMPTZ '2026-03-14 07:42:00+05:30',
    NULL
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM network_elements WHERE name = 'PUN-SDWAN-EDGE-02'),
    'warning',
    'WAN0 underlay experienced jitter spike above 35 ms for four polling intervals.',
    'SDWAN_CONTROLLER',
    'cleared',
    TIMESTAMPTZ '2026-03-07 11:02:00+05:30',
    TIMESTAMPTZ '2026-03-07 11:10:00+05:30'
  );

INSERT INTO workflows (tenant_id, name, trigger_type, steps_json, status, version)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Enterprise service activation',
    'order.completed',
    '[{"step":"validate_order","owner":"orchestration"},{"step":"reserve_capacity","owner":"network-ops"},{"step":"notify_customer","owner":"service-desk"}]'::jsonb,
    'active',
    3
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Critical alarm escalation',
    'alarm.raised',
    '[{"step":"create_ticket","owner":"noc"},{"step":"page_field_team","owner":"field-ops"},{"step":"send_customer_advisory","owner":"customer-success"}]'::jsonb,
    'active',
    2
  );

INSERT INTO workflow_instances (tenant_id, workflow_id, entity_type, entity_id, current_step, state_json, status, started_at, completed_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM workflows WHERE name = 'Enterprise service activation'),
    'order',
    (SELECT id FROM orders WHERE order_number = 'SO-2026-000184'),
    3,
    '{"capacityReserved":true,"customerNotified":true}'::jsonb,
    'completed',
    TIMESTAMPTZ '2026-01-09 10:30:00+05:30',
    TIMESTAMPTZ '2026-01-09 16:25:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM workflows WHERE name = 'Critical alarm escalation'),
    'alarm',
    (SELECT id FROM alarms WHERE description = 'PON port utilization exceeded threshold and optical power drift crossed policy limits.'),
    2,
    '{"ticketCreated":"TT-2026-0314","fieldTeamPaged":true}'::jsonb,
    'running',
    TIMESTAMPTZ '2026-03-14 07:43:00+05:30',
    NULL
  );

INSERT INTO slas (tenant_id, name, metric_type, target_value, measurement_window, penalty_json)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Enterprise Ethernet Gold',
    'uptime_pct',
    99.95,
    'monthly',
    '{"creditPct":7.5,"breachWindow":"30m"}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Managed SD-WAN Standard',
    'latency_ms',
    20,
    'weekly',
    '{"creditPct":3.0,"breachWindow":"15m"}'::jsonb
  );

INSERT INTO revenue_assurance_jobs (tenant_id, period_start, period_end, status, total_billed, total_rated, leakage_pct, completed_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    'completed',
    83898,
    85250,
    1.6126,
    TIMESTAMPTZ '2026-03-03 06:20:00+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    TIMESTAMPTZ '2026-03-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-03-31 23:59:59+05:30',
    'running',
    23364,
    19800,
    -18.0000,
    NULL
  );

INSERT INTO reconciliation_runs (tenant_id, period_start, period_end, status, gross_revenue, adjustments, approved_at, notes)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    'approved',
    83898,
    -1250,
    TIMESTAMPTZ '2026-03-05 17:10:00+05:30',
    'Credit note issued for branch failover incident lasting 96 seconds.'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    TIMESTAMPTZ '2026-03-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-03-31 23:59:59+05:30',
    'draft',
    23364,
    0,
    NULL,
    'March close remains open pending SIP trunk activation milestone.'
  );

INSERT INTO settlement_statements (tenant_id, partner_id, partner_type, period_start, period_end, direction, gross_amount, tax_amount, net_amount, currency, status, due_date, paid_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM vendors WHERE name = 'Nokia'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM customers WHERE account_number = 'ENT-MUM-24001'),
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
  );

INSERT INTO financial_reports (tenant_id, report_type, period_start, period_end, payload_json)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'monthly_margin',
    TIMESTAMPTZ '2026-02-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-02-28 23:59:59+05:30',
    '{"grossRevenue":83898,"networkCost":420000,"creditNotes":1250,"marginPct":18.4}'::jsonb
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'collections_snapshot',
    TIMESTAMPTZ '2026-03-01 00:00:00+05:30',
    TIMESTAMPTZ '2026-03-14 23:59:59+05:30',
    '{"current":50150,"overdue_0_30":33748,"overdue_31_60":0,"unbilled":23364}'::jsonb
  );

INSERT INTO api_registry (tenant_id, name, slug, version, standard, base_url, spec_url, auth_type, status, owner_team)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Service Inventory API',
    'service-inventory',
    'v4',
    'TMF638',
    'https://api.astratel.net/service-inventory',
    'https://developer.astratel.net/apis/service-inventory/v4/openapi.yaml',
    'bearer',
    'active',
    'Operations Engineering'
  );

INSERT INTO webhook_subscriptions (tenant_id, name, target_url, secret, event_types, headers_json, enabled)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'Finance Ledger Sink',
    'https://ledger.astratel.net/hooks/invoices',
    'astratel-ledger-hook-2026-001',
    ARRAY['invoice.generated', 'payment.captured', 'settlement.approved'],
    '{"x-partner":"finance-ledger","x-source":"telecosync"}'::jsonb,
    true
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'NOC Event Stream',
    'https://noc.astratel.net/hooks/events',
    'astratel-noc-hook-2026-009',
    ARRAY['alarm.raised', 'ticket.created', 'workflow.started'],
    '{"x-team":"noc","x-priority":"high"}'::jsonb,
    true
  );

INSERT INTO webhook_deliveries (tenant_id, subscription_id, event_type, payload_json, http_status, response_body, attempt_number, status, delivered_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM webhook_subscriptions WHERE name = 'Finance Ledger Sink'),
    'payment.captured',
    '{"invoiceNumber":"INV-2026-02-1841","amount":50150,"currency":"INR"}'::jsonb,
    200,
    '{"status":"accepted"}',
    1,
    'delivered',
    TIMESTAMPTZ '2026-03-08 11:41:05+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM webhook_subscriptions WHERE name = 'NOC Event Stream'),
    'alarm.raised',
    '{"element":"NVM-OLT-03","severity":"critical"}'::jsonb,
    202,
    '{"queued":true}',
    1,
    'delivered',
    TIMESTAMPTZ '2026-03-14 07:43:03+05:30'
  );

INSERT INTO event_log (tenant_id, event_type, entity_type, entity_id, payload_json, source_service, fired_at, processed, processed_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'invoice.generated',
    'invoice',
    (SELECT id FROM invoices WHERE invoice_number = 'INV-2026-02-2317'),
    '{"invoiceNumber":"INV-2026-02-2317","total":33748}'::jsonb,
    'billing-engine',
    TIMESTAMPTZ '2026-03-01 06:00:00+05:30',
    true,
    TIMESTAMPTZ '2026-03-01 06:00:02+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'payment.captured',
    'payment',
    (SELECT id FROM payments WHERE gateway_reference = 'HDFC-UTR-20260308-1841'),
    '{"invoiceNumber":"INV-2026-02-1841","amount":50150}'::jsonb,
    'payments-gateway',
    TIMESTAMPTZ '2026-03-08 11:40:00+05:30',
    true,
    TIMESTAMPTZ '2026-03-08 11:40:04+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'alarm.raised',
    'alarm',
    (SELECT id FROM alarms WHERE description = 'PON port utilization exceeded threshold and optical power drift crossed policy limits.'),
    '{"severity":"critical","element":"NVM-OLT-03"}'::jsonb,
    'nms-ingest',
    TIMESTAMPTZ '2026-03-14 07:42:00+05:30',
    false,
    NULL
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'workflow.started',
    'workflow_instance',
    (SELECT id FROM workflow_instances WHERE status = 'running' AND entity_type = 'alarm'),
    '{"workflow":"Critical alarm escalation","alarmRef":"NVM-OLT-03"}'::jsonb,
    'workflow-engine',
    TIMESTAMPTZ '2026-03-14 07:43:00+05:30',
    false,
    NULL
  );

INSERT INTO notifications (tenant_id, user_id, channel, title, body, status, sent_at, read_at)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    NULL,
    'email',
    'Invoice INV-2026-02-2317 issued',
    'February managed SD-WAN charges for Meridian Digital Services are ready for customer delivery.',
    'sent',
    TIMESTAMPTZ '2026-03-01 06:05:00+05:30',
    NULL
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    NULL,
    'sms',
    'Critical alarm on NVM-OLT-03',
    'Optical power drift detected at Navi Mumbai access node. Ticket TT-2026-0314 is active.',
    'sent',
    TIMESTAMPTZ '2026-03-14 07:44:00+05:30',
    NULL
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    NULL,
    'in_app',
    'Collections update received',
    'NorthStar Logistics payment posted against February invoice and settlement ledger updated.',
    'read',
    TIMESTAMPTZ '2026-03-08 11:45:00+05:30',
    TIMESTAMPTZ '2026-03-08 12:10:00+05:30'
  );

INSERT INTO documents (tenant_id, entity_type, entity_id, name, storage_path, mime_type, size_bytes, uploaded_by)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'invoice',
    (SELECT id FROM invoices WHERE invoice_number = 'INV-2026-02-1841'),
    'northstar-feb-2026-invoice.pdf',
    'billing/invoices/2026/02/northstar-feb-2026-invoice.pdf',
    'application/pdf',
    248932,
    NULL
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'network_element',
    (SELECT id FROM network_elements WHERE name = 'NVM-OLT-03'),
    'nvm-olt-03-maintenance-record.xlsx',
    'operations/maintenance/nvm-olt-03-maintenance-record.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    183420,
    NULL
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'order',
    (SELECT id FROM orders WHERE order_number = 'SO-2026-000312'),
    'seahaven-sip-design-pack.pdf',
    'service/orders/2026/03/seahaven-sip-design-pack.pdf',
    'application/pdf',
    529104,
    NULL
  );

INSERT INTO integration_connectors (
  tenant_id,
  name,
  connector_type,
  direction,
  system_type,
  config_json,
  enabled,
  last_run_at,
  last_run_status
)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    'TM Forum API Gateway',
    'custom',
    'bidirectional',
    'tmf',
    '{"baseUrl":"https://api.astratel.net","standards":["TMF620","TMF622","TMF638"],"tenantRouting":"header"}'::jsonb,
    true,
    TIMESTAMPTZ '2026-03-14 04:30:00+05:30',
    'success'
  );

INSERT INTO connector_executions (
  tenant_id,
  connector_id,
  trigger_type,
  status,
  request_json,
  response_json,
  error_message,
  duration_ms,
  started_at,
  completed_at
)
VALUES
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM integration_connectors WHERE name = 'Oracle ERP Billing Export'),
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
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM integration_connectors WHERE name = 'SolarWinds NMS Alarm Ingest'),
    'webhook',
    'success',
    '{"source":"SolarWinds","element":"NVM-OLT-03"}'::jsonb,
    '{"ticketCreated":"TT-2026-0314","workflowStarted":true}'::jsonb,
    NULL,
    742,
    TIMESTAMPTZ '2026-03-14 07:42:00+05:30',
    TIMESTAMPTZ '2026-03-14 07:42:01+05:30'
  ),
  (
    (SELECT id FROM tenants WHERE slug = 'astratel-networks'),
    (SELECT id FROM integration_connectors WHERE name = 'Razorpay Collections Feed'),
    'event',
    'success',
    '{"eventType":"payment.captured","invoiceNumber":"INV-2026-02-1841"}'::jsonb,
    '{"ledgerReference":"RCPT-20260308-50150"}'::jsonb,
    NULL,
    911,
    TIMESTAMPTZ '2026-03-08 11:40:00+05:30',
    TIMESTAMPTZ '2026-03-08 11:40:01+05:30'
  );

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'tenants',
    'roles',
    'locations',
    'customers',
    'accounts',
    'products',
    'vendors',
    'network_elements',
    'network_interfaces',
    'service_instances',
    'assets',
    'orders',
    'invoices',
    'payments',
    'usage_records',
    'performance_metrics',
    'trouble_tickets',
    'alarms',
    'workflows',
    'workflow_instances',
    'slas',
    'revenue_assurance_jobs',
    'reconciliation_runs',
    'settlement_statements',
    'financial_reports',
    'api_registry',
    'webhook_subscriptions',
    'webhook_deliveries',
    'event_log',
    'notifications',
    'documents',
    'integration_connectors',
    'connector_executions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE TRIGGER USER', table_name);
  END LOOP;
END
$$;
