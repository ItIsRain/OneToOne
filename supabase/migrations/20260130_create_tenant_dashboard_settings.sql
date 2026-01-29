CREATE TABLE tenant_dashboard_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) UNIQUE,
  show_greeting boolean DEFAULT true,
  show_metrics boolean DEFAULT true,
  show_quick_actions boolean DEFAULT true,
  show_onboarding boolean DEFAULT true,
  show_activity boolean DEFAULT true,
  show_upcoming boolean DEFAULT true,
  show_announcements boolean DEFAULT true,
  show_goals boolean DEFAULT true,
  show_bookmarks boolean DEFAULT true,
  widget_order jsonb DEFAULT '["greeting","metrics","quick_actions","onboarding","activity","upcoming","announcements","goals","bookmarks"]',
  accent_color text,
  banner_image_url text,
  banner_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE tenant_dashboard_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON tenant_dashboard_settings
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "insert_own" ON tenant_dashboard_settings
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "update_own" ON tenant_dashboard_settings
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
