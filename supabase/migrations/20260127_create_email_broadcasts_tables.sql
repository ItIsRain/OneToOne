-- Email broadcasts table to store broadcast metadata
CREATE TABLE email_broadcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    preheader TEXT,
    content TEXT NOT NULL,
    template TEXT,
    cta_text TEXT,
    cta_url TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    opened_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed', 'scheduled')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email broadcast recipients table to track individual delivery
CREATE TABLE email_broadcast_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    broadcast_id UUID NOT NULL REFERENCES email_broadcasts(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    recipient_type TEXT CHECK (recipient_type IN ('client', 'team', 'lead', 'contact')),
    recipient_id TEXT,
    personalized_subject TEXT,
    personalized_content TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_email_broadcasts_tenant_id ON email_broadcasts(tenant_id);
CREATE INDEX idx_email_broadcasts_created_by ON email_broadcasts(created_by);
CREATE INDEX idx_email_broadcasts_status ON email_broadcasts(status);
CREATE INDEX idx_email_broadcasts_created_at ON email_broadcasts(created_at DESC);
CREATE INDEX idx_email_broadcast_recipients_broadcast_id ON email_broadcast_recipients(broadcast_id);
CREATE INDEX idx_email_broadcast_recipients_status ON email_broadcast_recipients(status);

-- Enable RLS
ALTER TABLE email_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_broadcasts
CREATE POLICY "Users can view their tenant's broadcasts"
ON email_broadcasts FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can create broadcasts in their tenant"
ON email_broadcasts FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
);

CREATE POLICY "Users can update their tenant's broadcasts"
ON email_broadcasts FOR UPDATE
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);

-- RLS policies for email_broadcast_recipients
CREATE POLICY "Users can view recipients for their tenant's broadcasts"
ON email_broadcast_recipients FOR SELECT
TO authenticated
USING (
    broadcast_id IN (
        SELECT id FROM email_broadcasts WHERE tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Users can create recipients for their tenant's broadcasts"
ON email_broadcast_recipients FOR INSERT
TO authenticated
WITH CHECK (
    broadcast_id IN (
        SELECT id FROM email_broadcasts WHERE tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Users can update recipients for their tenant's broadcasts"
ON email_broadcast_recipients FOR UPDATE
TO authenticated
USING (
    broadcast_id IN (
        SELECT id FROM email_broadcasts WHERE tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_email_broadcasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_broadcasts_updated_at
    BEFORE UPDATE ON email_broadcasts
    FOR EACH ROW
    EXECUTE FUNCTION update_email_broadcasts_updated_at();
