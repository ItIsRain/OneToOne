-- Contacts Table for CRM Contact Management
CREATE TABLE contacts (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  secondary_email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  work_phone TEXT,

  -- Professional Information
  job_title TEXT,
  department TEXT,
  company TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,

  -- Relationships
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  is_primary_contact BOOLEAN DEFAULT false,
  reports_to UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  timezone TEXT,

  -- Communication Preferences
  preferred_contact_method TEXT CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('email', 'phone', 'whatsapp', 'linkedin', 'sms')),
  do_not_contact BOOLEAN DEFAULT false,
  email_opt_in BOOLEAN DEFAULT true,
  communication_notes TEXT,

  -- Engagement Tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'do_not_contact')),
  last_contacted_at TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  contact_frequency TEXT CHECK (contact_frequency IS NULL OR contact_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'as_needed')),

  -- Personal Details
  birthday DATE,
  anniversary DATE,
  personal_notes TEXT,

  -- Categorization
  contact_type TEXT DEFAULT 'other' CHECK (contact_type IN ('client_contact', 'lead_contact', 'vendor', 'partner', 'influencer', 'media', 'other')),
  tags TEXT[],
  source TEXT,

  -- Notes & Media
  notes TEXT,
  avatar_url TEXT,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Contacts
CREATE POLICY "Users can view contacts in own tenant" ON contacts
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert contacts in own tenant" ON contacts
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update contacts in own tenant" ON contacts
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete contacts in own tenant" ON contacts
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX idx_contacts_client_id ON contacts(client_id);
CREATE INDEX idx_contacts_lead_id ON contacts(lead_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_last_name ON contacts(last_name);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Apply updated_at trigger
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
