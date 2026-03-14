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
