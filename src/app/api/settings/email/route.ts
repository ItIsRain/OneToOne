import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailProvider, TenantEmailSettings, TenantEmailSettingsResponse } from '@/lib/email/types';
import { getProviderDefinition } from '@/config/emailProviders';
import { getUserIdFromRequest } from '@/hooks/useTenantFromHeaders';

// Mask sensitive values - show only first few and last few characters
function maskValue(value: string): string {
  if (!value || value.length < 8) return '••••••••';
  const prefix = value.substring(0, 4);
  const suffix = value.substring(value.length - 4);
  return `${prefix}••••${suffix}`;
}

// Mask config based on provider fields
function maskConfig(
  provider: EmailProvider,
  config: Record<string, unknown>
): Record<string, string> {
  const providerDef = getProviderDefinition(provider);
  if (!providerDef) return {};

  const masked: Record<string, string> = {};

  for (const field of providerDef.fields) {
    const value = config[field.name];
    if (value !== undefined && value !== null) {
      if (field.type === 'password') {
        masked[field.name] = maskValue(String(value));
      } else {
        masked[field.name] = String(value);
      }
    }
  }

  return masked;
}

// GET - Fetch email settings for current tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Fetch email settings
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_email_settings')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Fetch email settings error:', settingsError);
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        settings: {
          id: null,
          provider: 'system',
          from_email: null,
          from_name: null,
          config: {},
          is_verified: false,
          last_test_at: null,
          last_test_status: null,
        } as TenantEmailSettingsResponse,
      });
    }

    // Mask sensitive config values
    const response: TenantEmailSettingsResponse = {
      id: settings.id,
      provider: settings.provider,
      from_email: settings.from_email,
      from_name: settings.from_name,
      config: maskConfig(settings.provider, settings.config || {}),
      is_verified: settings.is_verified,
      last_test_at: settings.last_test_at,
      last_test_status: settings.last_test_status,
    };

    return NextResponse.json({ settings: response });
  } catch (error) {
    console.error('Get email settings error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST - Save email settings
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json();
    const { provider, from_email, from_name, config } = body;

    // Validate provider
    const validProviders: EmailProvider[] = [
      'system',
      'resend',
      'sendgrid',
      'mailgun',
      'amazon_ses',
      'postmark',
      'sparkpost',
      'smtp',
    ];

    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Validate from_email format if provided
    if (from_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(from_email)) {
        return NextResponse.json({ error: 'Invalid from_email format' }, { status: 400 });
      }
    }

    // Check if settings already exist
    const { data: existing } = await supabase
      .from('tenant_email_settings')
      .select('id, config')
      .eq('tenant_id', profile.tenant_id)
      .single();

    // Merge config - preserve existing values if new ones are masked
    let finalConfig = config || {};
    if (existing && existing.config) {
      const providerDef = getProviderDefinition(provider);
      if (providerDef) {
        for (const field of providerDef.fields) {
          if (field.type === 'password') {
            // If the value looks masked, use the existing value
            const newValue = config?.[field.name];
            if (newValue && (newValue.includes('••••') || newValue === '••••••••')) {
              finalConfig[field.name] = existing.config[field.name];
            }
          }
        }
      }
    }

    // Reset verification when settings change
    const settingsData: Partial<TenantEmailSettings> = {
      tenant_id: profile.tenant_id,
      provider,
      from_email: from_email || null,
      from_name: from_name || null,
      config: finalConfig,
      is_verified: false,
    };

    let result;
    if (existing) {
      // Update existing
      result = await supabase
        .from('tenant_email_settings')
        .update(settingsData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from('tenant_email_settings')
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Save email settings error:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Return masked response
    const response: TenantEmailSettingsResponse = {
      id: result.data.id,
      provider: result.data.provider,
      from_email: result.data.from_email,
      from_name: result.data.from_name,
      config: maskConfig(result.data.provider, result.data.config || {}),
      is_verified: result.data.is_verified,
      last_test_at: result.data.last_test_at,
      last_test_status: result.data.last_test_status,
    };

    return NextResponse.json({ settings: response, success: true });
  } catch (error) {
    console.error('Save email settings error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
