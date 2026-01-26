-- Finance Module Tables Migration
-- Run this SQL in the Supabase SQL Editor

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Invoice Identification
    invoice_number TEXT NOT NULL,

    -- Related Entities
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,

    -- Financial Details
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'fixed',
    discount_value DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    balance_due DECIMAL(12, 2) GENERATED ALWAYS AS (total - amount_paid) STORED,
    currency TEXT DEFAULT 'USD',

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded')),

    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    sent_date TIMESTAMPTZ,
    paid_date TIMESTAMPTZ,

    -- Payment Terms
    payment_terms TEXT DEFAULT 'net_30' CHECK (payment_terms IN ('due_on_receipt', 'net_7', 'net_15', 'net_30', 'net_45', 'net_60', 'custom')),
    payment_terms_days INTEGER,

    -- Optional Details
    title TEXT,
    notes TEXT,
    terms_and_conditions TEXT,
    footer_note TEXT,

    -- Recipient Information (can override client details)
    billing_name TEXT,
    billing_email TEXT,
    billing_address TEXT,
    billing_city TEXT,
    billing_country TEXT,
    billing_postal_code TEXT,

    -- Bank/Payment Details
    bank_name TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    bank_routing_number TEXT,
    bank_swift_code TEXT,
    payment_instructions TEXT,

    -- Tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMPTZ,

    -- Reference Numbers
    po_number TEXT,
    reference_number TEXT,

    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Unique constraint for invoice number per tenant
    UNIQUE(tenant_id, invoice_number)
);

-- =====================================================
-- INVOICE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Item Details
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    unit TEXT DEFAULT 'unit',

    -- Calculations
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'fixed',
    discount_value DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    amount DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- Sorting
    sort_order INTEGER DEFAULT 0,

    -- Optional
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

    -- Payment Details
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Payment Method
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'paypal', 'stripe', 'other')),

    -- Reference
    transaction_id TEXT,
    reference_number TEXT,

    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),

    -- Notes
    notes TEXT,

    -- Client reference (in case invoice is deleted)
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Expense Details
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Category
    category TEXT CHECK (category IN ('travel', 'supplies', 'equipment', 'software', 'marketing', 'meals', 'utilities', 'rent', 'salaries', 'contractors', 'insurance', 'taxes', 'other')),

    -- Related Entities
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    vendor_name TEXT,

    -- Payment Info
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'paypal', 'company_card', 'other')),
    is_reimbursable BOOLEAN DEFAULT FALSE,
    is_billable BOOLEAN DEFAULT FALSE,

    -- Documentation
    receipt_url TEXT,
    receipt_number TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,

    -- Tax
    tax_deductible BOOLEAN DEFAULT TRUE,
    tax_category TEXT,

    -- Notes
    notes TEXT,
    tags TEXT[],

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- BUDGETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Budget Details
    name TEXT NOT NULL,
    description TEXT,

    -- Financial
    amount DECIMAL(12, 2) NOT NULL,
    spent DECIMAL(12, 2) DEFAULT 0,
    remaining DECIMAL(12, 2) GENERATED ALWAYS AS (amount - spent) STORED,
    currency TEXT DEFAULT 'USD',

    -- Period
    period_type TEXT CHECK (period_type IN ('monthly', 'quarterly', 'yearly', 'project', 'custom')) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,

    -- Category
    category TEXT CHECK (category IN ('marketing', 'operations', 'payroll', 'travel', 'equipment', 'software', 'contractors', 'events', 'general', 'other')),

    -- Related Entities
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    department TEXT,

    -- Alerts
    alert_threshold DECIMAL(5, 2) DEFAULT 80, -- Alert when X% of budget is used
    alert_sent BOOLEAN DEFAULT FALSE,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'exceeded')),

    -- Notes
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- RECURRING INVOICES TABLE (Optional - for future use)
-- =====================================================
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Template Details (similar to invoices)
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT,

    -- Recurrence
    frequency TEXT CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly', 'quarterly', 'yearly')) NOT NULL,
    next_issue_date DATE NOT NULL,
    end_date DATE,

    -- Template items stored as JSONB
    items JSONB NOT NULL DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    invoices_generated INTEGER DEFAULT 0,

    -- Auto-send
    auto_send BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);

CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(start_date, end_date);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Invoices RLS
CREATE POLICY "Users can view invoices in their tenant" ON invoices
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert invoices in their tenant" ON invoices
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update invoices in their tenant" ON invoices
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete invoices in their tenant" ON invoices
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Invoice Items RLS (through invoice relationship)
CREATE POLICY "Users can manage invoice items through invoices" ON invoice_items
    FOR ALL USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Payments RLS
CREATE POLICY "Users can view payments in their tenant" ON payments
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert payments in their tenant" ON payments
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update payments in their tenant" ON payments
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete payments in their tenant" ON payments
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Expenses RLS
CREATE POLICY "Users can view expenses in their tenant" ON expenses
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert expenses in their tenant" ON expenses
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update expenses in their tenant" ON expenses
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete expenses in their tenant" ON expenses
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Budgets RLS
CREATE POLICY "Users can view budgets in their tenant" ON budgets
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert budgets in their tenant" ON budgets
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update budgets in their tenant" ON budgets
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete budgets in their tenant" ON budgets
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Recurring Invoices RLS
CREATE POLICY "Users can manage recurring invoices in their tenant" ON recurring_invoices
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION (if not exists)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTION: Generate Invoice Number
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT := 'INV';
    v_year TEXT := TO_CHAR(CURRENT_DATE, 'YY');
    v_count INTEGER;
    v_number TEXT;
BEGIN
    SELECT COUNT(*) + 1 INTO v_count
    FROM invoices
    WHERE tenant_id = p_tenant_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

    v_number := v_prefix || '-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: Finance Overview Stats
-- =====================================================
CREATE OR REPLACE VIEW finance_overview AS
SELECT
    i.tenant_id,
    -- Invoice counts
    COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('cancelled', 'refunded')) AS total_invoices,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'draft') AS draft_invoices,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status IN ('sent', 'viewed')) AS pending_invoices,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'paid') AS paid_invoices,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'overdue') AS overdue_invoices,

    -- Financial totals
    COALESCE(SUM(i.total) FILTER (WHERE i.status NOT IN ('cancelled', 'refunded', 'draft')), 0) AS total_invoiced,
    COALESCE(SUM(i.amount_paid), 0) AS total_collected,
    COALESCE(SUM(i.balance_due) FILTER (WHERE i.status NOT IN ('cancelled', 'refunded', 'draft', 'paid')), 0) AS total_outstanding,
    COALESCE(SUM(i.balance_due) FILTER (WHERE i.status = 'overdue'), 0) AS total_overdue,

    -- This month
    COALESCE(SUM(i.total) FILTER (
        WHERE i.issue_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND i.status NOT IN ('cancelled', 'refunded', 'draft')
    ), 0) AS invoiced_this_month,
    COALESCE(SUM(i.amount_paid) FILTER (
        WHERE i.paid_date >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0) AS collected_this_month
FROM invoices i
GROUP BY i.tenant_id;

COMMENT ON TABLE invoices IS 'Stores all invoice records for the finance module';
COMMENT ON TABLE invoice_items IS 'Line items for each invoice';
COMMENT ON TABLE payments IS 'Payment records linked to invoices';
COMMENT ON TABLE expenses IS 'Business expense tracking';
COMMENT ON TABLE budgets IS 'Budget planning and tracking';
