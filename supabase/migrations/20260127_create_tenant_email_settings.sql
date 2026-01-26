-- Create tenant_email_settings table for custom email provider configuration
CREATE TABLE IF NOT EXISTS tenant_email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'system' CHECK (provider IN ('system', 'resend', 'sendgrid', 'mailgun', 'amazon_ses', 'postmark', 'sparkpost', 'smtp')),
  from_email TEXT,
  from_name TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_verified BOOLEAN DEFAULT FALSE,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_email_settings_tenant_id ON tenant_email_settings(tenant_id);

-- Enable RLS
ALTER TABLE tenant_email_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow users to view their tenant's email settings
CREATE POLICY "tenant_email_settings_select"
  ON tenant_email_settings
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to insert email settings for their tenant (if none exist)
CREATE POLICY "tenant_email_settings_insert"
  ON tenant_email_settings
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to update their tenant's email settings
CREATE POLICY "tenant_email_settings_update"
  ON tenant_email_settings
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to delete their tenant's email settings
CREATE POLICY "tenant_email_settings_delete"
  ON tenant_email_settings
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tenant_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS tenant_email_settings_updated_at ON tenant_email_settings;
CREATE TRIGGER tenant_email_settings_updated_at
  BEFORE UPDATE ON tenant_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_email_settings_updated_at();
