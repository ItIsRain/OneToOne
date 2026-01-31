import { sendWithProvider } from './email/providers';
import { EmailProvider, ProviderConfig } from './email/types';
import { logger } from './logger';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  tenantId?: string;
}

interface TenantEmailSettings {
  provider: EmailProvider;
  from_email: string | null;
  from_name: string | null;
  config: ProviderConfig;
  is_verified: boolean;
}

// Cache tenant settings to avoid repeated DB calls
const tenantSettingsCache = new Map<
  string,
  { settings: TenantEmailSettings | null; timestamp: number }
>();
const CACHE_TTL = 60000; // 1 minute cache

async function getTenantEmailSettings(
  tenantId: string
): Promise<TenantEmailSettings | null> {
  // Check cache first
  const cached = tenantSettingsCache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.settings;
  }

  try {
    // Dynamic import to avoid issues during build
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('tenant_email_settings')
      .select('provider, from_email, from_name, config, is_verified')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      tenantSettingsCache.set(tenantId, { settings: null, timestamp: Date.now() });
      return null;
    }

    const settings = data as TenantEmailSettings;
    tenantSettingsCache.set(tenantId, { settings, timestamp: Date.now() });
    return settings;
  } catch (error) {
    logger.error('[EMAIL] Failed to fetch tenant settings:', error);
    return null;
  }
}

// Default system email sender (Resend)
async function sendWithSystemDefault(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    logger.debug(`[DEV] No RESEND_API_KEY - Email would be sent to ${to}:`, subject);
    return true;
  }

  logger.info(`[EMAIL] Sending email via system default to ${to}: ${subject}`);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: '1i1 <noreply@1i1.ae>',
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      logger.error('[EMAIL] Resend error:', responseData);
      return false;
    }

    logger.info('[EMAIL] Email sent successfully to:', to, '- Resend ID:', responseData.id);
    return true;
  } catch (error) {
    logger.error('[EMAIL] Send email error:', error);
    return false;
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  tenantId,
}: SendEmailOptions): Promise<boolean> {
  // If tenant ID is provided, try to use tenant's custom provider
  if (tenantId) {
    const tenantSettings = await getTenantEmailSettings(tenantId);

    if (
      tenantSettings &&
      tenantSettings.provider !== 'system' &&
      tenantSettings.is_verified &&
      tenantSettings.from_email
    ) {
      logger.info(
        `[EMAIL] Using tenant provider (${tenantSettings.provider}) for ${to}`
      );

      const result = await sendWithProvider(
        tenantSettings.provider,
        tenantSettings.config,
        {
          to,
          subject,
          html,
          from: tenantSettings.from_email,
          fromName: tenantSettings.from_name || undefined,
        }
      );

      if (result.success) {
        logger.info(
          '[EMAIL] Tenant provider sent successfully, messageId:',
          result.messageId
        );
        return true;
      }

      // If tenant provider fails, log and fallback to system default
      logger.error(
        '[EMAIL] Tenant provider failed, falling back to system:',
        result.error
      );
    }
  }

  // Use system default
  return sendWithSystemDefault(to, subject, html);
}

interface TeamInviteEmailParams {
  to: string;
  inviteeName: string;
  inviterName: string;
  teamName: string;
  role: string;
  inviteToken: string;
  tenantId?: string;
}

export async function sendTeamInviteEmail({
  to,
  inviteeName,
  inviterName,
  teamName,
  role,
  inviteToken,
  tenantId,
}: TeamInviteEmailParams): Promise<boolean> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteUrl = `${APP_URL}/invite/${inviteToken}`;

  logger.info(`[EMAIL] Preparing team invite email to ${to}, invite URL: ${inviteUrl}`);

  // Simple HTML template matching the OTP email style that works
  const html = `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #111; margin-bottom: 20px;">You're invited to join ${teamName}</h2>
      <p style="color: #666; margin-bottom: 20px;">
        Hi ${inviteeName}, ${inviterName} has invited you to join ${teamName} as a ${role}.
      </p>
      <p style="color: #666; margin-bottom: 20px;">
        Click the link below to accept the invitation and set up your account:
      </p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <a href="${inviteUrl}" style="color: #4F46E5; word-break: break-all;">${inviteUrl}</a>
      </div>
      <p style="color: #999; font-size: 14px;">This invitation expires in 7 days.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `You're invited to join ${teamName}`,
    html,
    tenantId,
  });
}

// Export cache clear function for testing
export function clearTenantSettingsCache(tenantId?: string) {
  if (tenantId) {
    tenantSettingsCache.delete(tenantId);
  } else {
    tenantSettingsCache.clear();
  }
}
