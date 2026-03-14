CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  contact_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS network_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  model TEXT,
  serial_number TEXT,
  ip_address INET,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  commissioned_at TIMESTAMPTZ,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS network_interfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  network_element_id UUID NOT NULL REFERENCES network_elements(id) ON DELETE CASCADE,
  interface_name TEXT NOT NULL,
  type TEXT,
  bandwidth_mbps INT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  network_element_id UUID REFERENCES network_elements(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES network_elements(id) ON DELETE SET NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  network_element_id UUID NOT NULL REFERENCES network_elements(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value NUMERIC(18, 6),
  unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_elements_tenant_id ON network_elements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_interfaces_tenant_id ON network_interfaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_instances_tenant_id ON service_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_id ON performance_metrics(tenant_id);

DROP TRIGGER IF EXISTS trg_network_elements_set_updated_at ON network_elements;
CREATE TRIGGER trg_network_elements_set_updated_at
BEFORE UPDATE ON network_elements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_network_interfaces_set_updated_at ON network_interfaces;
CREATE TRIGGER trg_network_interfaces_set_updated_at
BEFORE UPDATE ON network_interfaces
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_service_instances_set_updated_at ON service_instances;
CREATE TRIGGER trg_service_instances_set_updated_at
BEFORE UPDATE ON service_instances
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_assets_set_updated_at ON assets;
CREATE TRIGGER trg_assets_set_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
