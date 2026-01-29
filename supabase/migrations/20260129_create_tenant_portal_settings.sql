CREATE TABLE tenant_portal_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) UNIQUE,
  hero_headline text,
  hero_subtitle text,
  banner_image_url text,
  show_events boolean DEFAULT true,
  featured_event_ids jsonb DEFAULT '[]',
  custom_cta_text text,
  custom_cta_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenant_portal_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON tenant_portal_settings FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_own" ON tenant_portal_settings FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "update_own" ON tenant_portal_settings FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Also allow public read access for portal display (no auth needed)
CREATE POLICY "public_read" ON tenant_portal_settings FOR SELECT USING (true);
