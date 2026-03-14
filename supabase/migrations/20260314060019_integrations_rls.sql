ALTER TABLE api_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_api_registry ON api_registry;
CREATE POLICY tenant_isolation_api_registry ON api_registry
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_integration_connectors ON integration_connectors;
CREATE POLICY tenant_isolation_integration_connectors ON integration_connectors
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_connector_executions ON connector_executions;
CREATE POLICY tenant_isolation_connector_executions ON connector_executions
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_webhook_subscriptions ON webhook_subscriptions;
CREATE POLICY tenant_isolation_webhook_subscriptions ON webhook_subscriptions
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_webhook_deliveries ON webhook_deliveries;
CREATE POLICY tenant_isolation_webhook_deliveries ON webhook_deliveries
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_event_log ON event_log;
CREATE POLICY tenant_isolation_event_log ON event_log
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
