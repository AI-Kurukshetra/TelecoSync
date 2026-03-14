CREATE TABLE IF NOT EXISTS revenue_assurance_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_billed NUMERIC(18, 4),
  total_rated NUMERIC(18, 4),
  leakage_amount NUMERIC(18, 4) GENERATED ALWAYS AS (COALESCE(total_rated, 0) - COALESCE(total_billed, 0)) STORED,
  leakage_pct NUMERIC(6, 4),
  triggered_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES revenue_assurance_jobs(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  usage_record_id UUID REFERENCES usage_records(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  discrepancy_type TEXT NOT NULL,
  expected_amount NUMERIC(18, 4),
  actual_amount NUMERIC(18, 4),
  delta NUMERIC(18, 4) GENERATED ALWAYS AS (COALESCE(expected_amount, 0) - COALESCE(actual_amount, 0)) STORED,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  gross_revenue NUMERIC(18, 4),
  adjustments NUMERIC(18, 4),
  net_revenue NUMERIC(18, 4) GENERATED ALWAYS AS (COALESCE(gross_revenue, 0) + COALESCE(adjustments, 0)) STORED,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settlement_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  partner_type TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  direction TEXT NOT NULL,
  gross_amount NUMERIC(18, 4),
  tax_amount NUMERIC(18, 4),
  net_amount NUMERIC(18, 4),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_assurance_jobs_tenant_id ON revenue_assurance_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_discrepancies_tenant_id ON revenue_discrepancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_id ON reconciliation_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settlement_statements_tenant_id ON settlement_statements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_tenant_id ON financial_reports(tenant_id);

DROP TRIGGER IF EXISTS trg_revenue_assurance_jobs_set_updated_at ON revenue_assurance_jobs;
CREATE TRIGGER trg_revenue_assurance_jobs_set_updated_at
BEFORE UPDATE ON revenue_assurance_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_revenue_discrepancies_set_updated_at ON revenue_discrepancies;
CREATE TRIGGER trg_revenue_discrepancies_set_updated_at
BEFORE UPDATE ON revenue_discrepancies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reconciliation_runs_set_updated_at ON reconciliation_runs;
CREATE TRIGGER trg_reconciliation_runs_set_updated_at
BEFORE UPDATE ON reconciliation_runs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_settlement_statements_set_updated_at ON settlement_statements;
CREATE TRIGGER trg_settlement_statements_set_updated_at
BEFORE UPDATE ON settlement_statements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

SELECT apply_audit_trigger('revenue_assurance_jobs');
SELECT apply_audit_trigger('revenue_discrepancies');
SELECT apply_audit_trigger('reconciliation_runs');
SELECT apply_audit_trigger('settlement_statements');
SELECT apply_audit_trigger('financial_reports');
