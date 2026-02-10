import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationProvider } from '@/config/integrationProviders';
import { getUserIdFromRequest } from '@/hooks/useTenantFromHeaders';

function maskValue(value: string): string {
  if (!value || value.length < 8) return '••••••••';
  const prefix = value.substring(0, 4);
  const suffix = value.substring(value.length - 4);
  return `${prefix}••••${suffix}`;
}

function maskConfig(
  providerId: string,
  config: Record<string, unknown>
): Record<string, string> {
  const providerDef = getIntegrationProvider(providerId);
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

// GET - Fetch all integration configs for current tenant
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { data: integrations, error: fetchError } = await supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', profile.tenant_id);

    if (fetchError) {
      console.error('Fetch integrations error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Mask sensitive fields in each integration config
    const masked = (integrations || []).map((integration) => ({
      ...integration,
      config: maskConfig(integration.provider, integration.config || {}),
    }));

    return NextResponse.json({ integrations: masked });
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST - Save/update an integration config
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json();
    const { provider, config, is_active } = body;

    // Validate provider
    const providerDef = getIntegrationProvider(provider);
    if (!providerDef) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Check if integration already exists for this provider + tenant
    const { data: existing } = await supabase
      .from('tenant_integrations')
      .select('id, config')
      .eq('tenant_id', profile.tenant_id)
      .eq('provider', provider)
      .single();

    // Merge config - preserve existing values if new ones are masked
    let finalConfig = config || {};
    if (existing && existing.config) {
      for (const field of providerDef.fields) {
        if (field.type === 'password') {
          const newValue = config?.[field.name];
          if (newValue && (newValue.includes('••••') || newValue === '••••••••')) {
            finalConfig[field.name] = existing.config[field.name];
          }
        }
      }
    }

    const integrationData = {
      tenant_id: profile.tenant_id,
      provider,
      config: finalConfig,
      is_active: is_active !== undefined ? is_active : true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      result = await supabase
        .from('tenant_integrations')
        .update(integrationData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('tenant_integrations')
        .insert(integrationData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Save integration error:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Return masked response
    const response = {
      ...result.data,
      config: maskConfig(result.data.provider, result.data.config || {}),
    };

    return NextResponse.json({ integration: response, success: true });
  } catch (error) {
    console.error('Save integration error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
