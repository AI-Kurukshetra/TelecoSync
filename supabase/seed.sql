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

\ir ../packages/database/seed/dev-seed.sql
\ir ../packages/database/seed/connectors-seed.sql

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
