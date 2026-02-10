import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendWithProvider } from '@/lib/email/providers';
import { EmailProvider } from '@/lib/email/types';
import { getUserIdFromRequest } from '@/hooks/useTenantFromHeaders';

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// POST - Send test email
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get user's email and profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, first_name, email')
      .eq('id', userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json();
    const { test_email } = body;

    // Use provided test email or profile email
    const recipientEmail = test_email || profile.email;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No email address provided' }, { status: 400 });
    }

    // Fetch current settings
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_email_settings')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Email settings not configured' },
        { status: 400 }
      );
    }

    // Check provider is not system (system uses default)
    if (settings.provider === 'system') {
      return NextResponse.json(
        { error: 'System default provider does not require testing' },
        { status: 400 }
      );
    }

    // Validate from email
    if (!settings.from_email) {
      return NextResponse.json(
        { error: 'From email address is required' },
        { status: 400 }
      );
    }

    // Generate test email HTML
    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 24px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
          <h1 style="color: #166534; margin: 0 0 8px 0; font-size: 24px;">Test Email Successful!</h1>
          <p style="color: #15803d; margin: 0;">Your email provider is configured correctly.</p>
        </div>
        <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;"><strong>Provider:</strong> ${settings.provider}</p>
          <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;"><strong>From:</strong> ${settings.from_name || ''} &lt;${settings.from_email}&gt;</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    // Send test email using the configured provider
    const result = await sendWithProvider(
      settings.provider as EmailProvider,
      settings.config || {},
      {
        to: recipientEmail,
        subject: '✓ Test Email - Email Provider Configured Successfully',
        html: testHtml,
        from: settings.from_email,
        fromName: settings.from_name || undefined,
      }
    );

    // Update settings with test result
    const testStatus = result.success
      ? `Success - Email sent to ${recipientEmail}`
      : `Failed - ${result.error}`;

    await supabase
      .from('tenant_email_settings')
      .update({
        is_verified: result.success,
        last_test_at: new Date().toISOString(),
        last_test_status: testStatus,
      })
      .eq('id', settings.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${recipientEmail}`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
