// Integration provider field definitions for UI

export interface IntegrationField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export type IntegrationCategory = 'messaging' | 'ai' | 'payments' | 'calendar' | 'automation';

export interface IntegrationProviderDefinition {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  fields: IntegrationField[];
  docsUrl?: string;
}

export const integrationProviders: IntegrationProviderDefinition[] = [
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS and voice communication platform',
    category: 'messaging',
    fields: [
      {
        name: 'account_sid',
        label: 'Account SID',
        type: 'text',
        placeholder: 'AC...',
        required: true,
      },
      {
        name: 'auth_token',
        label: 'Auth Token',
        type: 'password',
        placeholder: 'Your auth token',
        required: true,
      },
      {
        name: 'phone_number',
        label: 'Phone Number',
        type: 'text',
        placeholder: '+1234567890',
        required: true,
      },
    ],
    docsUrl: 'https://www.twilio.com/docs',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team messaging and notifications',
    category: 'messaging',
    fields: [
      {
        name: 'webhook_url',
        label: 'Webhook URL',
        type: 'text',
        placeholder: 'https://hooks.slack.com/services/...',
        required: true,
      },
      {
        name: 'bot_token',
        label: 'Bot Token',
        type: 'password',
        placeholder: 'xoxb-...',
      },
      {
        name: 'default_channel',
        label: 'Default Channel',
        type: 'text',
        placeholder: '#general',
      },
    ],
    docsUrl: 'https://api.slack.com/docs',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'AI voice generation and text-to-speech',
    category: 'ai',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'Your API key',
        required: true,
      },
      {
        name: 'voice_id',
        label: 'Voice ID',
        type: 'text',
        placeholder: 'Voice ID',
      },
      {
        name: 'model_id',
        label: 'Model ID',
        type: 'text',
        placeholder: 'eleven_monolingual_v1',
      },
    ],
    docsUrl: 'https://docs.elevenlabs.io',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'AI models for text generation and analysis',
    category: 'ai',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-...',
        required: true,
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        options: [
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        ],
      },
      {
        name: 'organization_id',
        label: 'Organization ID',
        type: 'text',
        placeholder: 'org-...',
      },
    ],
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and billing',
    category: 'payments',
    fields: [
      {
        name: 'secret_key',
        label: 'Secret Key',
        type: 'password',
        placeholder: 'sk_live_...',
        required: true,
      },
      {
        name: 'webhook_secret',
        label: 'Webhook Secret',
        type: 'password',
        placeholder: 'whsec_...',
      },
    ],
    docsUrl: 'https://stripe.com/docs',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'WhatsApp Business messaging',
    category: 'messaging',
    fields: [
      {
        name: 'api_token',
        label: 'API Token',
        type: 'password',
        placeholder: 'Your API token',
        required: true,
      },
      {
        name: 'phone_number_id',
        label: 'Phone Number ID',
        type: 'text',
        placeholder: 'Phone number ID',
        required: true,
      },
      {
        name: 'business_account_id',
        label: 'Business Account ID',
        type: 'text',
        placeholder: 'Business account ID',
      },
    ],
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Calendar sync and event management',
    category: 'calendar',
    fields: [
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Your client ID',
        required: true,
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Your client secret',
        required: true,
      },
      {
        name: 'refresh_token',
        label: 'Refresh Token',
        type: 'password',
        placeholder: 'Your refresh token',
        required: true,
      },
    ],
    docsUrl: 'https://developers.google.com/calendar',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5000+ apps via webhooks',
    category: 'automation',
    fields: [
      {
        name: 'webhook_url',
        label: 'Webhook URL',
        type: 'text',
        placeholder: 'https://hooks.zapier.com/...',
        required: true,
      },
    ],
    docsUrl: 'https://zapier.com/docs',
  },
];

export const categoryLabels: Record<IntegrationCategory, string> = {
  messaging: 'Messaging',
  ai: 'AI & Voice',
  payments: 'Payments',
  calendar: 'Calendar',
  automation: 'Automation',
};

export function getIntegrationProvider(providerId: string): IntegrationProviderDefinition | undefined {
  return integrationProviders.find((p) => p.id === providerId);
}
