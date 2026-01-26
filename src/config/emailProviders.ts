// Email provider field definitions for UI

import { EmailProvider } from '@/lib/email/types';

export interface ProviderField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface ProviderDefinition {
  id: EmailProvider;
  name: string;
  description: string;
  fields: ProviderField[];
}

export const emailProviders: ProviderDefinition[] = [
  {
    id: 'system',
    name: 'System Default',
    description: 'Use the platform\'s default email provider',
    fields: [],
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Modern email API for developers',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 're_...',
        required: true,
      },
    ],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery service by Twilio',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'SG...',
        required: true,
      },
    ],
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    description: 'Email API service for developers',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'key-...',
        required: true,
      },
      {
        name: 'domain',
        label: 'Domain',
        type: 'text',
        placeholder: 'mg.yourdomain.com',
        required: true,
      },
      {
        name: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        options: [
          { value: 'us', label: 'US' },
          { value: 'eu', label: 'EU' },
        ],
      },
    ],
  },
  {
    id: 'amazon_ses',
    name: 'Amazon SES',
    description: 'Amazon Simple Email Service',
    fields: [
      {
        name: 'access_key',
        label: 'Access Key ID',
        type: 'password',
        placeholder: 'AKIA...',
        required: true,
      },
      {
        name: 'secret_key',
        label: 'Secret Access Key',
        type: 'password',
        placeholder: 'Your secret key',
        required: true,
      },
      {
        name: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        options: [
          { value: 'us-east-1', label: 'US East (N. Virginia)' },
          { value: 'us-east-2', label: 'US East (Ohio)' },
          { value: 'us-west-2', label: 'US West (Oregon)' },
          { value: 'eu-west-1', label: 'EU (Ireland)' },
          { value: 'eu-central-1', label: 'EU (Frankfurt)' },
          { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
          { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
          { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
          { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
        ],
      },
    ],
  },
  {
    id: 'postmark',
    name: 'Postmark',
    description: 'Fast, reliable email delivery',
    fields: [
      {
        name: 'server_token',
        label: 'Server Token',
        type: 'password',
        placeholder: 'Your server token',
        required: true,
      },
    ],
  },
  {
    id: 'sparkpost',
    name: 'SparkPost',
    description: 'Email delivery and analytics',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'Your API key',
        required: true,
      },
      {
        name: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        options: [
          { value: 'us', label: 'US' },
          { value: 'eu', label: 'EU' },
        ],
      },
    ],
  },
  {
    id: 'smtp',
    name: 'Custom SMTP',
    description: 'Connect your own SMTP server',
    fields: [
      {
        name: 'host',
        label: 'SMTP Host',
        type: 'text',
        placeholder: 'smtp.example.com',
        required: true,
      },
      {
        name: 'port',
        label: 'Port',
        type: 'number',
        placeholder: '587',
        required: true,
      },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        placeholder: 'your-username',
        required: true,
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Your password',
        required: true,
      },
      {
        name: 'encryption',
        label: 'Encryption',
        type: 'select',
        required: true,
        options: [
          { value: 'tls', label: 'TLS (Recommended)' },
          { value: 'ssl', label: 'SSL' },
          { value: 'none', label: 'None' },
        ],
      },
    ],
  },
];

export function getProviderDefinition(providerId: EmailProvider): ProviderDefinition | undefined {
  return emailProviders.find((p) => p.id === providerId);
}
