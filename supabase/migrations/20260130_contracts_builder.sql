-- Contracts builder: add columns to contracts + create contract_templates table

-- Add builder columns to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS proposal_id uuid REFERENCES proposals(id);

-- Contract templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  description text,
  category text,
  sections jsonb DEFAULT '[]'::jsonb,
  default_terms text,
  default_payment_terms text,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_tenant" ON contract_templates
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "insert_own_tenant" ON contract_templates
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "update_own_tenant" ON contract_templates
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "delete_own_tenant" ON contract_templates
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
