-- Add client login and approval settings to tenant_portal_settings

-- Client login settings
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS login_methods jsonb DEFAULT '["password", "magic_link"]'::jsonb;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS login_welcome_message text;

-- Approval settings
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS require_approval_comment boolean DEFAULT false;
ALTER TABLE tenant_portal_settings ADD COLUMN IF NOT EXISTS approval_notification_email text;
