import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to verify tenant access
async function verifyAccess(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    return { error: "No tenant found", status: 400 };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .eq("tenant_id", profile.tenant_id)
    .single();

  if (!event) {
    return { error: "Event not found", status: 404 };
  }

  return { user, profile, event };
}

// DELETE - Remove a judge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; judgeId: string }> }
) {
  try {
    const { id, judgeId } = await params;
    const supabase = await createClient();

    const access = await verifyAccess(supabase, id);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Delete the judge (cascade will delete their scores)
    const { error } = await supabase
      .from("event_judges")
      .delete()
      .eq("id", judgeId)
      .eq("event_id", id);

    if (error) {
      console.error("Error deleting judge:", error);
      return NextResponse.json({ error: "Failed to remove judge" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing judge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Resend invitation email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; judgeId: string }> }
) {
  try {
    const { id, judgeId } = await params;
    const supabase = await createClient();

    const access = await verifyAccess(supabase, id);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { event } = access;

    // Get judge
    const { data: judge } = await supabase
      .from("event_judges")
      .select("*")
      .eq("id", judgeId)
      .eq("event_id", id)
      .single();

    if (!judge) {
      return NextResponse.json({ error: "Judge not found" }, { status: 404 });
    }

    // Generate new access token
    const { data: updatedJudge, error: updateError } = await supabase
      .from("event_judges")
      .update({
        access_token: crypto.randomUUID(),
        invited_at: new Date().toISOString(),
      })
      .eq("id", judgeId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating judge token:", updateError);
      return NextResponse.json({ error: "Failed to regenerate invitation" }, { status: 500 });
    }

    // Send invitation email
    const judgingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/judge/${updatedJudge.access_token}`;

    try {
      await resend.emails.send({
        from: "Events <events@1i1.ae>",
        to: judge.email,
        subject: `Reminder: You've been invited to judge: ${event.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color: #1a1a1a; margin-bottom: 24px;">Reminder: You're Invited to Judge!</h1>

              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hello${judge.name ? ` ${judge.name}` : ''},
              </p>

              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                This is a reminder that you've been invited to be a judge for <strong>${event.title}</strong>.
              </p>

              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Click the button below to access your judging dashboard where you can review submissions and provide your scores.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${judgingUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Access Judging Dashboard
                </a>
              </div>

              <p style="color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                This link is unique to you. Please do not share it with others. Any previous links have been invalidated.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">

              <p style="color: #9a9a9a; font-size: 12px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Invitation email resent",
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
