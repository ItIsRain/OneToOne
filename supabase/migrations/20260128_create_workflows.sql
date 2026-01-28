-- Workflow Automation Tables
-- Enables agencies to create automated pipelines with triggers, action steps, approval gates, and notifications.

-- workflows: Workflow definitions
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'client_created', 'project_created', 'task_status_changed', 'event_created', 'invoice_overdue')),
  trigger_config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  is_template BOOLEAN DEFAULT false,
  template_category TEXT CHECK (template_category IN ('onboarding', 'review', 'event', 'billing')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- workflow_steps: Ordered action steps within a workflow
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('create_task', 'send_notification', 'update_status', 'approval', 'wait_delay', 'send_email')),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- workflow_runs: Execution instances
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  trigger_data JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES profiles(id),
  error_message TEXT
);

-- workflow_step_executions: Per-step execution log
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting_approval')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output JSONB,
  error_message TEXT
);

-- workflow_approvals: Approval requests
CREATE TABLE IF NOT EXISTS workflow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_execution_id UUID NOT NULL REFERENCES workflow_step_executions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_from UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comment TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications: Real notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('workflow', 'approval', 'task', 'system', 'event', 'payment')),
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(tenant_id, trigger_type, status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_tenant_id ON workflow_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_run_id ON workflow_step_executions(run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_tenant_id ON workflow_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_requested_from ON workflow_approvals(requested_from, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- RLS Policies
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Workflows RLS
CREATE POLICY "Tenants can view their own workflows" ON workflows
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenants can insert their own workflows" ON workflows
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenants can update their own workflows" ON workflows
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenants can delete their own workflows" ON workflows
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Workflow Steps RLS (via workflow tenant)
CREATE POLICY "Tenants can view their workflow steps" ON workflow_steps
  FOR SELECT USING (workflow_id IN (SELECT id FROM workflows WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Tenants can insert their workflow steps" ON workflow_steps
  FOR INSERT WITH CHECK (workflow_id IN (SELECT id FROM workflows WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Tenants can update their workflow steps" ON workflow_steps
  FOR UPDATE USING (workflow_id IN (SELECT id FROM workflows WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Tenants can delete their workflow steps" ON workflow_steps
  FOR DELETE USING (workflow_id IN (SELECT id FROM workflows WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

-- Workflow Runs RLS
CREATE POLICY "Tenants can view their own runs" ON workflow_runs
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenants can insert their own runs" ON workflow_runs
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenants can update their own runs" ON workflow_runs
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Step Executions RLS (via run tenant)
CREATE POLICY "Tenants can view their step executions" ON workflow_step_executions
  FOR SELECT USING (run_id IN (SELECT id FROM workflow_runs WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Tenants can insert their step executions" ON workflow_step_executions
  FOR INSERT WITH CHECK (run_id IN (SELECT id FROM workflow_runs WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Tenants can update their step executions" ON workflow_step_executions
  FOR UPDATE USING (run_id IN (SELECT id FROM workflow_runs WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

-- Approvals RLS
CREATE POLICY "Tenants can view their approvals" ON workflow_approvals
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenants can insert their approvals" ON workflow_approvals
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenants can update their approvals" ON workflow_approvals
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Notifications RLS
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Tenants can insert notifications" ON notifications
  FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());
