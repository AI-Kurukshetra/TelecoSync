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
