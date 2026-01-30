-- Add new integration step types to workflow_steps check constraint
ALTER TABLE workflow_steps DROP CONSTRAINT workflow_steps_step_type_check;

ALTER TABLE workflow_steps ADD CONSTRAINT workflow_steps_step_type_check CHECK (
  step_type = ANY (ARRAY[
    'create_task', 'create_project', 'create_event', 'create_invoice',
    'create_client', 'create_lead', 'create_contact',
    'send_notification', 'send_email', 'send_banner', 'send_slack', 'send_sms', 'send_whatsapp',
    'update_status', 'update_field', 'assign_to', 'add_tag', 'remove_tag',
    'condition', 'approval', 'wait_delay', 'webhook', 'http_request',
    'log_activity', 'schedule_action',
    'elevenlabs_tts', 'openai_generate', 'stripe_payment_link',
    'google_calendar_event', 'zapier_trigger'
  ])
);
