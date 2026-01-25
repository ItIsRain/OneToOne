-- Leads Table for CRM Pipeline Management
CREATE TABLE leads (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Contact Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  country TEXT,

  -- Sales Pipeline
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  estimated_value DECIMAL(12,2) DEFAULT 0,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  score INTEGER DEFAULT 0,

  -- Source & Attribution
  source TEXT,
  campaign TEXT,
  referral_source TEXT,

  -- Industry & Company Info
  industry TEXT,
  company_size TEXT CHECK (company_size IS NULL OR company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  budget_range TEXT,

  -- Timeline
  next_follow_up TIMESTAMPTZ,
  last_contacted TIMESTAMPTZ,
  expected_close_date DATE,
  actual_close_date DATE,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Notes & Requirements
  notes TEXT,
  requirements TEXT,
  pain_points TEXT,
  competitor_info TEXT,
  lost_reason TEXT,

  -- Categorization
  tags TEXT[],
  services_interested TEXT[],

  -- Conversion
  converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  conversion_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Leads
CREATE POLICY "Users can view leads in own tenant" ON leads
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert leads in own tenant" ON leads
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update leads in own tenant" ON leads
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete leads in own tenant" ON leads
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up);
CREATE INDEX idx_leads_converted_to_client_id ON leads(converted_to_client_id);

-- Apply updated_at trigger
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
