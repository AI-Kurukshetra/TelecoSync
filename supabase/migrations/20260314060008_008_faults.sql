CREATE TABLE IF NOT EXISTS trouble_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  network_element_id UUID REFERENCES network_elements(id) ON DELETE SET NULL,
  service_instance_id UUID REFERENCES service_instances(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  network_element_id UUID REFERENCES network_elements(id) ON DELETE SET NULL,
  severity TEXT NOT NULL,
  description TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  raised_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cleared_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trouble_tickets_tenant_id ON trouble_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trouble_tickets_status ON trouble_tickets(status);
CREATE INDEX IF NOT EXISTS idx_alarms_tenant_id ON alarms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alarms_status ON alarms(status);

DROP TRIGGER IF EXISTS trg_trouble_tickets_set_updated_at ON trouble_tickets;
CREATE TRIGGER trg_trouble_tickets_set_updated_at
BEFORE UPDATE ON trouble_tickets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
