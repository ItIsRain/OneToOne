-- Add ai_voice_call to workflow step types
ALTER TABLE workflow_steps DROP CONSTRAINT IF EXISTS workflow_steps_step_type_check;

ALTER TABLE workflow_steps ADD CONSTRAINT workflow_steps_step_type_check CHECK (
  step_type = ANY (ARRAY[
    'create_task', 'create_project', 'create_event', 'create_invoice',
    'create_client', 'create_lead', 'create_contact',
    'send_notification', 'send_email', 'send_banner', 'send_slack', 'send_sms', 'send_whatsapp',
    'update_status', 'update_field', 'assign_to', 'add_tag', 'remove_tag',
    'condition', 'approval', 'wait_delay', 'webhook', 'http_request',
    'log_activity', 'schedule_action',
    'elevenlabs_tts', 'openai_generate', 'stripe_payment_link',
    'google_calendar_event', 'zapier_trigger',
    'ai_voice_call'
  ])
);

-- Voice agent calls table for tracking AI-powered phone conversations
CREATE TABLE IF NOT EXISTS voice_agent_calls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_run_id uuid REFERENCES workflow_runs(id) ON DELETE SET NULL,
  step_execution_id uuid REFERENCES workflow_step_executions(id) ON DELETE SET NULL,

  -- Twilio call details
  call_sid text UNIQUE,
  from_number text NOT NULL,
  to_number text NOT NULL,

  -- Call status
  status text NOT NULL DEFAULT 'initiated' CHECK (
    status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'busy', 'no_answer', 'cancelled')
  ),

  -- AI configuration
  ai_provider text NOT NULL DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'anthropic')),
  ai_model text NOT NULL,
  system_prompt text NOT NULL,
  conversation_goal text,

  -- Call limits and tracking
  max_duration_seconds integer DEFAULT 300,
  duration_seconds integer,

  -- Conversation data
  transcript jsonb DEFAULT '[]'::jsonb,
  summary text,
  goal_achieved boolean,

  -- Recording
  recording_url text,
  recording_sid text,

  -- Cost tracking
  total_cost_usd numeric(10,6) DEFAULT 0,
  twilio_cost_usd numeric(10,6) DEFAULT 0,
  stt_cost_usd numeric(10,6) DEFAULT 0,
  llm_cost_usd numeric(10,6) DEFAULT 0,
  tts_cost_usd numeric(10,6) DEFAULT 0,

  -- Voice settings
  voice_id text,
  voice_provider text DEFAULT 'elevenlabs',

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_tenant_id ON voice_agent_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_workflow_run_id ON voice_agent_calls(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_call_sid ON voice_agent_calls(call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_status ON voice_agent_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_agent_calls_created_at ON voice_agent_calls(created_at DESC);

-- Enable Row Level Security
ALTER TABLE voice_agent_calls ENABLE ROW LEVEL SECURITY;

-- RLS policy for tenant isolation
CREATE POLICY "tenant_voice_calls_isolation" ON voice_agent_calls
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Grant access to authenticated users (filtered by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON voice_agent_calls TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE voice_agent_calls IS 'Tracks AI-powered voice calls initiated by workflows. Each call includes conversation transcripts, goal tracking, and cost breakdown.';
