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

CREATE INDEX IF NOT EXISTS idx_slas_tenant_id ON slas(tenant_id);

DROP TRIGGER IF EXISTS trg_slas_set_updated_at ON slas;
CREATE TRIGGER trg_slas_set_updated_at
BEFORE UPDATE ON slas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
