CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value_json JSONB,
  new_value_json JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_row JSONB := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  old_row JSONB := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  resolved_tenant_id UUID;
  resolved_entity_id UUID;
BEGIN
  resolved_tenant_id := COALESCE(
    NULLIF(new_row ->> 'tenant_id', '')::uuid,
    NULLIF(old_row ->> 'tenant_id', '')::uuid,
    CASE
      WHEN TG_TABLE_NAME = 'tenants' THEN COALESCE(
        NULLIF(new_row ->> 'id', '')::uuid,
        NULLIF(old_row ->> 'id', '')::uuid
      )
      ELSE NULL
    END
  );

  resolved_entity_id := COALESCE(
    NULLIF(new_row ->> 'id', '')::uuid,
    NULLIF(old_row ->> 'id', '')::uuid
  );

  INSERT INTO audit_logs (
    tenant_id,
    action,
    entity_type,
    entity_id,
    old_value_json,
    new_value_json
  )
  VALUES (
    resolved_tenant_id,
    lower(TG_OP),
    TG_TABLE_NAME,
    resolved_entity_id,
    old_row,
    new_row
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION apply_audit_trigger(target_table REGCLASS)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  trigger_name TEXT;
BEGIN
  trigger_name := 'audit_' || replace(target_table::TEXT, '.', '_');
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_name, target_table);
  EXECUTE format(
    'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn()',
    trigger_name,
    target_table
  );
END;
$$;

SELECT apply_audit_trigger('public.user_profiles');
SELECT apply_audit_trigger('tenants');
SELECT apply_audit_trigger('roles');
SELECT apply_audit_trigger('locations');
SELECT apply_audit_trigger('customers');
SELECT apply_audit_trigger('accounts');
SELECT apply_audit_trigger('products');
SELECT apply_audit_trigger('promotions');
SELECT apply_audit_trigger('orders');
SELECT apply_audit_trigger('work_orders');
SELECT apply_audit_trigger('invoices');
SELECT apply_audit_trigger('payments');
SELECT apply_audit_trigger('usage_records');
SELECT apply_audit_trigger('rating_rules');
SELECT apply_audit_trigger('vendors');
SELECT apply_audit_trigger('network_elements');
SELECT apply_audit_trigger('network_interfaces');
SELECT apply_audit_trigger('service_instances');
SELECT apply_audit_trigger('assets');
SELECT apply_audit_trigger('performance_metrics');
SELECT apply_audit_trigger('trouble_tickets');
SELECT apply_audit_trigger('alarms');
SELECT apply_audit_trigger('workflows');
SELECT apply_audit_trigger('workflow_instances');
SELECT apply_audit_trigger('slas');
SELECT apply_audit_trigger('sla_violations');
