ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trouble_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_vendors ON vendors;
CREATE POLICY tenant_isolation_vendors ON vendors
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_network_elements ON network_elements;
CREATE POLICY tenant_isolation_network_elements ON network_elements
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_network_interfaces ON network_interfaces;
CREATE POLICY tenant_isolation_network_interfaces ON network_interfaces
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_service_instances ON service_instances;
CREATE POLICY tenant_isolation_service_instances ON service_instances
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_assets ON assets;
CREATE POLICY tenant_isolation_assets ON assets
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_performance_metrics ON performance_metrics;
CREATE POLICY tenant_isolation_performance_metrics ON performance_metrics
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_trouble_tickets ON trouble_tickets;
CREATE POLICY tenant_isolation_trouble_tickets ON trouble_tickets
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_alarms ON alarms;
CREATE POLICY tenant_isolation_alarms ON alarms
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_workflows ON workflows;
CREATE POLICY tenant_isolation_workflows ON workflows
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_workflow_instances ON workflow_instances;
CREATE POLICY tenant_isolation_workflow_instances ON workflow_instances
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
