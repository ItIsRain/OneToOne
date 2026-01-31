-- Add new portal section columns to tenant_portal_settings

-- Services section
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS show_services boolean DEFAULT false;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS services_heading text;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS services_subheading text;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '[]'::jsonb;

-- FAQ section
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS show_faq boolean DEFAULT false;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS faq_heading text;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS faq_items jsonb DEFAULT '[]'::jsonb;

-- CTA Banner section
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS show_cta_banner boolean DEFAULT false;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS cta_banner_heading text;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS cta_banner_body text;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS cta_banner_button_text text;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS cta_banner_button_url text;

-- Stats section
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS show_stats boolean DEFAULT false;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS stats_heading text;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '[]'::jsonb;

-- Partners section
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS show_partners boolean DEFAULT false;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS partners_heading text;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS partners jsonb DEFAULT '[]'::jsonb;

-- Update default section_order for existing rows that don't have new sections
-- (New sections will be appended when loaded by the app)
