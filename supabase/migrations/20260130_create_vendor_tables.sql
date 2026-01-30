-- Vendor management tables

-- 1. Vendor categories
CREATE TABLE IF NOT EXISTS vendor_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  description text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_tenant" ON vendor_categories
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_own_tenant" ON vendor_categories
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "update_own_tenant" ON vendor_categories
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "delete_own_tenant" ON vendor_categories
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 2. Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  company text,
  email text,
  phone text,
  category text,
  services text[],
  hourly_rate numeric(10,2),
  rating numeric(3,2),
  status text DEFAULT 'active',
  notes text,
  website text,
  address text,
  city text,
  country text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_tenant" ON vendors
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_own_tenant" ON vendors
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "update_own_tenant" ON vendors
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "delete_own_tenant" ON vendors
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Event-vendor assignments (many-to-many)
CREATE TABLE IF NOT EXISTS event_vendors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  event_id uuid NOT NULL REFERENCES events(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  role text,
  agreed_rate numeric(10,2),
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, vendor_id)
);

ALTER TABLE event_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_tenant" ON event_vendors
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_own_tenant" ON event_vendors
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "update_own_tenant" ON event_vendors
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "delete_own_tenant" ON event_vendors
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
