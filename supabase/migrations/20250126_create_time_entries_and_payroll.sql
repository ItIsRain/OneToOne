-- Time Entries table for tracking work hours
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,

  -- Time tracking
  date date NOT NULL,
  start_time time,
  end_time time,
  duration_minutes integer NOT NULL DEFAULT 0,

  -- Description
  description text,

  -- Billing
  is_billable boolean DEFAULT true,
  hourly_rate numeric DEFAULT 0,

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'invoiced')),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  rejection_reason text,

  -- Invoice reference
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,

  -- Break tracking
  break_minutes integer DEFAULT 0,

  -- Location/context
  work_type text DEFAULT 'regular' CHECK (work_type IN ('regular', 'overtime', 'holiday', 'weekend', 'on_call')),
  location text,

  -- Notes and tags
  notes text,
  tags text[] DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_entries
CREATE POLICY "Users can view time entries in their tenant"
  ON time_entries FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert time entries in their tenant"
  ON time_entries FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update time entries in their tenant"
  ON time_entries FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete time entries in their tenant"
  ON time_entries FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexes for time_entries
CREATE INDEX idx_time_entries_tenant_id ON time_entries(tenant_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_status ON time_entries(status);

-- ============================================
-- Payroll Tables
-- ============================================

-- Payroll Runs (monthly/bi-weekly payroll processing)
CREATE TABLE IF NOT EXISTS payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Period
  period_start date NOT NULL,
  period_end date NOT NULL,
  pay_date date NOT NULL,

  -- Run info
  run_number text,
  name text,

  -- Totals
  total_gross numeric DEFAULT 0,
  total_deductions numeric DEFAULT 0,
  total_net numeric DEFAULT 0,
  total_employer_taxes numeric DEFAULT 0,
  total_employer_contributions numeric DEFAULT 0,

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'processing', 'completed', 'cancelled')),

  -- Approval
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  processed_by uuid REFERENCES profiles(id),
  processed_at timestamptz,

  -- Notes
  notes text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Payroll Items (individual employee entries in a payroll run)
CREATE TABLE IF NOT EXISTS payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payroll_run_id uuid NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Earnings
  base_salary numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  hours_worked numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  overtime_rate numeric DEFAULT 0,

  -- Calculated earnings
  regular_pay numeric DEFAULT 0,
  overtime_pay numeric DEFAULT 0,
  bonus numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  allowances numeric DEFAULT 0,
  reimbursements numeric DEFAULT 0,
  other_earnings numeric DEFAULT 0,
  gross_pay numeric DEFAULT 0,

  -- Deductions (employee)
  tax_federal numeric DEFAULT 0,
  tax_state numeric DEFAULT 0,
  tax_local numeric DEFAULT 0,
  social_security numeric DEFAULT 0,
  medicare numeric DEFAULT 0,
  health_insurance numeric DEFAULT 0,
  dental_insurance numeric DEFAULT 0,
  vision_insurance numeric DEFAULT 0,
  retirement_401k numeric DEFAULT 0,
  other_deductions numeric DEFAULT 0,
  total_deductions numeric DEFAULT 0,

  -- Net pay
  net_pay numeric DEFAULT 0,

  -- Employer contributions (not deducted from employee)
  employer_social_security numeric DEFAULT 0,
  employer_medicare numeric DEFAULT 0,
  employer_health_insurance numeric DEFAULT 0,
  employer_retirement_match numeric DEFAULT 0,
  employer_unemployment numeric DEFAULT 0,
  total_employer_cost numeric DEFAULT 0,

  -- Payment details
  payment_method text DEFAULT 'direct_deposit' CHECK (payment_method IN ('direct_deposit', 'check', 'cash', 'wire')),
  bank_account_last4 text,
  check_number text,

  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  paid_at timestamptz,

  -- Notes
  notes text,
  adjustment_reason text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for payroll tables
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_runs
CREATE POLICY "Users can view payroll runs in their tenant"
  ON payroll_runs FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert payroll runs in their tenant"
  ON payroll_runs FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update payroll runs in their tenant"
  ON payroll_runs FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete payroll runs in their tenant"
  ON payroll_runs FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for payroll_items
CREATE POLICY "Users can view payroll items in their tenant"
  ON payroll_items FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert payroll items in their tenant"
  ON payroll_items FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update payroll items in their tenant"
  ON payroll_items FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete payroll items in their tenant"
  ON payroll_items FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexes for payroll tables
CREATE INDEX idx_payroll_runs_tenant_id ON payroll_runs(tenant_id);
CREATE INDEX idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX idx_payroll_runs_period ON payroll_runs(period_start, period_end);
CREATE INDEX idx_payroll_items_tenant_id ON payroll_items(tenant_id);
CREATE INDEX idx_payroll_items_payroll_run_id ON payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_employee_id ON payroll_items(employee_id);
CREATE INDEX idx_payroll_items_status ON payroll_items(status);
