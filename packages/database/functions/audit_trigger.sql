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
