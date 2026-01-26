import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";

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

interface RecipientInput {
  email: string;
  name: string;
  type: "client" | "team" | "lead" | "contact";
  id?: string;
  personalizedSubject: string;
  personalizedContent: string;
}

interface BroadcastInput {
  subject: string;
  preheader?: string;
  content: string;
  template?: string;
  ctaText?: string;
  ctaUrl?: string;
  attachments?: {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];
  recipients: RecipientInput[];
}

// Generate HTML email from plain text content
function generateEmailHtml(
  content: string,
  options: {
    preheader?: string;
    ctaText?: string;
    ctaUrl?: string;
    attachments?: { url: string; fileName: string }[];
  }
): string {
  // Convert line breaks to HTML paragraphs
  const paragraphs = content
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p)
    .map((p) => `<p style="color: #374151; margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const ctaButton = options.ctaText && options.ctaUrl
    ? `<div style="margin: 24px 0;">
        <a href="${options.ctaUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">${options.ctaText}</a>
      </div>`
    : "";

  const attachmentsList = options.attachments && options.attachments.length > 0
    ? `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Attachments:</p>
        ${options.attachments.map((a) => `<a href="${a.url}" style="color: #4F46E5; font-size: 14px; display: block; margin-bottom: 4px;">${a.fileName}</a>`).join("")}
      </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${options.preheader ? `<span style="display: none; max-height: 0; overflow: hidden;">${options.preheader}</span>` : ""}
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${paragraphs}
      ${ctaButton}
      ${attachmentsList}
    </div>
    <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
      <p>Sent via 1i1</p>
    </div>
  </div>
</body>
</html>`;
}

// GET - Fetch broadcast history
export async function GET() {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ broadcasts: [], stats: { totalSent: 0, totalBroadcasts: 0 } });
    }

    // Fetch broadcasts for this tenant
    const { data: broadcasts, error: broadcastError } = await supabase
      .from("email_broadcasts")
      .select(`
        id,
        subject,
        template,
        recipient_count,
        sent_count,
        opened_count,
        status,
        sent_at,
        created_at
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (broadcastError) {
      console.error("Fetch broadcasts error:", broadcastError);
      return NextResponse.json({ error: broadcastError.message }, { status: 500 });
    }

    // Calculate stats
    const totalSent = broadcasts?.reduce((acc, b) => acc + (b.sent_count || 0), 0) || 0;
    const totalBroadcasts = broadcasts?.length || 0;

    // Format the response
    const formattedBroadcasts = broadcasts?.map((b) => ({
      id: b.id,
      subject: b.subject,
      template: b.template,
      recipientCount: b.recipient_count,
      sentAt: b.sent_at
        ? new Date(b.sent_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : null,
      status: b.status,
      openRate: b.sent_count > 0 ? Math.round((b.opened_count / b.sent_count) * 100) : 0,
    })) || [];

    return NextResponse.json({
      broadcasts: formattedBroadcasts,
      stats: {
        totalSent,
        totalBroadcasts,
      },
    });
  } catch (error) {
    console.error("Get broadcasts error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Send a new broadcast
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body: BroadcastInput = await request.json();
    const { subject, preheader, content, template, ctaText, ctaUrl, attachments, recipients } = body;

    if (!subject || !content || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Subject, content, and recipients are required" }, { status: 400 });
    }

    // Create the broadcast record
    const { data: broadcast, error: createError } = await supabase
      .from("email_broadcasts")
      .insert({
        tenant_id: profile.tenant_id,
        created_by: user.id,
        subject,
        preheader: preheader || null,
        content,
        template: template || null,
        cta_text: ctaText || null,
        cta_url: ctaUrl || null,
        attachments: attachments || [],
        recipient_count: recipients.length,
        status: "sending",
      })
      .select()
      .single();

    if (createError || !broadcast) {
      console.error("Create broadcast error:", createError);
      return NextResponse.json({ error: "Failed to create broadcast" }, { status: 500 });
    }

    // Create recipient records
    const recipientRecords = recipients.map((r) => ({
      broadcast_id: broadcast.id,
      recipient_email: r.email,
      recipient_name: r.name,
      recipient_type: r.type,
      recipient_id: r.id || null,
      personalized_subject: r.personalizedSubject,
      personalized_content: r.personalizedContent,
      status: "pending",
    }));

    const { error: recipientError } = await supabase
      .from("email_broadcast_recipients")
      .insert(recipientRecords);

    if (recipientError) {
      console.error("Create recipients error:", recipientError);
      // Still continue to send emails
    }

    // Send emails to all recipients using tenant's email provider if configured
    let sentCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const htmlContent = generateEmailHtml(recipient.personalizedContent, {
          preheader,
          ctaText,
          ctaUrl,
          attachments: attachments?.map((a) => ({ url: a.url, fileName: a.fileName })),
        });

        const success = await sendEmail({
          to: recipient.email,
          subject: recipient.personalizedSubject,
          html: htmlContent,
          tenantId: profile.tenant_id,
        });

        if (success) {
          sentCount++;
          // Update recipient status
          await supabase
            .from("email_broadcast_recipients")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("broadcast_id", broadcast.id)
            .eq("recipient_email", recipient.email);
        } else {
          errors.push(`Failed to send to ${recipient.email}`);
          await supabase
            .from("email_broadcast_recipients")
            .update({ status: "failed", error_message: "Send failed" })
            .eq("broadcast_id", broadcast.id)
            .eq("recipient_email", recipient.email);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Error sending to ${recipient.email}: ${errorMessage}`);
        await supabase
          .from("email_broadcast_recipients")
          .update({ status: "failed", error_message: errorMessage })
          .eq("broadcast_id", broadcast.id)
          .eq("recipient_email", recipient.email);
      }
    }

    // Update broadcast status
    const finalStatus = sentCount === recipients.length ? "sent" : sentCount > 0 ? "sent" : "failed";
    await supabase
      .from("email_broadcasts")
      .update({
        status: finalStatus,
        sent_count: sentCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", broadcast.id);

    return NextResponse.json({
      success: true,
      broadcastId: broadcast.id,
      sentCount,
      totalRecipients: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error("Send broadcast error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
