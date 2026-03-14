ALTER TABLE revenue_assurance_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE slas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_revenue_assurance_jobs ON revenue_assurance_jobs;
CREATE POLICY tenant_isolation_revenue_assurance_jobs ON revenue_assurance_jobs
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_revenue_discrepancies ON revenue_discrepancies;
CREATE POLICY tenant_isolation_revenue_discrepancies ON revenue_discrepancies
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_reconciliation_runs ON reconciliation_runs;
CREATE POLICY tenant_isolation_reconciliation_runs ON reconciliation_runs
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_settlement_statements ON settlement_statements;
CREATE POLICY tenant_isolation_settlement_statements ON settlement_statements
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_financial_reports ON financial_reports;
CREATE POLICY tenant_isolation_financial_reports ON financial_reports
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_slas ON slas;
CREATE POLICY tenant_isolation_slas ON slas
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_sla_violations ON sla_violations;
CREATE POLICY tenant_isolation_sla_violations ON sla_violations
  FOR ALL USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
