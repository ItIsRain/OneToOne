// Email provider types

export type EmailProvider =
  | 'system'
  | 'resend'
  | 'sendgrid'
  | 'mailgun'
  | 'amazon_ses'
  | 'postmark'
  | 'sparkpost'
  | 'smtp';

// Provider-specific config types
export interface ResendConfig {
  api_key: string;
}

export interface SendGridConfig {
  api_key: string;
}

export interface MailgunConfig {
  api_key: string;
  domain: string;
  region: 'us' | 'eu';
}

export interface AmazonSESConfig {
  access_key: string;
  secret_key: string;
  region: string;
}

export interface PostmarkConfig {
  server_token: string;
}

export interface SparkPostConfig {
  api_key: string;
  region: 'us' | 'eu';
}

export interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'none' | 'tls' | 'ssl';
}

export type ProviderConfig =
  | ResendConfig
  | SendGridConfig
  | MailgunConfig
  | AmazonSESConfig
  | PostmarkConfig
  | SparkPostConfig
  | SMTPConfig
  | Record<string, never>;

// Database record type
export interface TenantEmailSettings {
  id: string;
  tenant_id: string;
  provider: EmailProvider;
  from_email: string | null;
  from_name: string | null;
  config: ProviderConfig;
  is_verified: boolean;
  last_test_at: string | null;
  last_test_status: string | null;
  created_at: string;
  updated_at: string;
}

// API response type (with masked credentials)
export interface TenantEmailSettingsResponse {
  id: string | null; // null when settings don't exist yet
  provider: EmailProvider;
  from_email: string | null;
  from_name: string | null;
  config: Record<string, string>; // Masked values
  is_verified: boolean;
  last_test_at: string | null;
  last_test_status: string | null;
}

// Email send options
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

// Email send result
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
