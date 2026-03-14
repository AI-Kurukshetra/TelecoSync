CREATE TABLE IF NOT EXISTS slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  target_value NUMERIC(10, 4),
  measurement_window TEXT,
  penalty_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sla_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sla_id UUID NOT NULL REFERENCES slas(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actual_value NUMERIC(10, 4),
  target_value NUMERIC(10, 4),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  penalty_applied NUMERIC(18, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slas_tenant_id ON slas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sla_violations_tenant_id ON sla_violations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sla_violations_sla_id ON sla_violations(sla_id);

DROP TRIGGER IF EXISTS trg_slas_set_updated_at ON slas;
CREATE TRIGGER trg_slas_set_updated_at
BEFORE UPDATE ON slas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
