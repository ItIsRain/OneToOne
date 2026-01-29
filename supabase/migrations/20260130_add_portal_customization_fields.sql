ALTER TABLE tenant_portal_settings
  ADD COLUMN IF NOT EXISTS hero_layout text DEFAULT 'centered',
  ADD COLUMN IF NOT EXISTS show_about_section boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS about_heading text,
  ADD COLUMN IF NOT EXISTS about_body text,
  ADD COLUMN IF NOT EXISTS show_testimonials boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS secondary_cta_text text,
  ADD COLUMN IF NOT EXISTS secondary_cta_url text,
  ADD COLUMN IF NOT EXISTS show_footer boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS footer_text text,
  ADD COLUMN IF NOT EXISTS section_order jsonb DEFAULT '["hero","events","about","testimonials"]',
  ADD COLUMN IF NOT EXISTS portal_accent_color text;
