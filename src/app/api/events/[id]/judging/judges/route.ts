import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET - List all judges for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Verify event belongs to tenant
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get judges with their scoring stats
    const { data: judges, error } = await supabase
      .from("event_judges")
      .select(`
        id,
        email,
        name,
        status,
        invited_at,
        last_accessed_at,
        created_at
      `)
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching judges:", error);
      return NextResponse.json({ error: "Failed to fetch judges" }, { status: 500 });
    }

    // Get score counts per judge
    const judgeIds = judges?.map(j => j.id) || [];
    const { data: scoreCounts } = await supabase
      .from("submission_scores")
      .select("judge_id")
      .in("judge_id", judgeIds);

    const scoreCountMap = new Map<string, number>();
    scoreCounts?.forEach(s => {
      scoreCountMap.set(s.judge_id, (scoreCountMap.get(s.judge_id) || 0) + 1);
    });

    const judgesWithStats = judges?.map(judge => ({
      ...judge,
      scores_submitted: scoreCountMap.get(judge.id) || 0,
    }));

    return NextResponse.json({ judges: judgesWithStats || [] });
  } catch (error) {
    console.error("Error fetching judges:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add a new judge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Verify event belongs to tenant and get event details
    const { data: event } = await supabase
      .from("events")
      .select("id, title, judging_status")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if judge already exists
    const { data: existingJudge } = await supabase
      .from("event_judges")
      .select("id")
      .eq("event_id", id)
      .eq("email", email.toLowerCase())
      .single();

    if (existingJudge) {
      return NextResponse.json({ error: "Judge with this email already exists" }, { status: 400 });
    }

    // Create judge record
    const { data: judge, error: createError } = await supabase
      .from("event_judges")
      .insert({
        event_id: id,
        email: email.toLowerCase(),
        name: name || null,
        status: "pending",
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating judge:", createError);
      return NextResponse.json({ error: "Failed to add judge" }, { status: 500 });
    }

    // Generate judging URL
    const judgingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/judge/${judge.access_token}`;

    // Send invitation email
    let emailSent = false;
    try {
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Events <events@1i1.ae>",
        to: email,
        subject: `You've been invited to judge: ${event.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h1 style="color: #1a1a1a; margin-bottom: 24px;">You're Invited to Judge!</h1>

              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hello${name ? ` ${name}` : ''},
              </p>

              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                You've been invited to be a judge for <strong>${event.title}</strong>.
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
                This link is unique to you. Please do not share it with others.
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
      emailSent = true;
      console.log("Email sent successfully");
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't fail the request if email fails, judge is still added
    }

    return NextResponse.json({
      success: true,
      emailSent,
      judgingUrl, // Include URL so it can be copied manually if email fails
      judge: {
        id: judge.id,
        email: judge.email,
        name: judge.name,
        status: judge.status,
        invited_at: judge.invited_at,
      },
    });
  } catch (error) {
    console.error("Error adding judge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
