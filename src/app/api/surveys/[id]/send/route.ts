import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { sendEmail } from "@/lib/email";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

function buildSurveyEmailHtml(options: {
  attendeeName: string;
  surveyTitle: string;
  eventTitle: string;
  surveyUrl: string;
}) {
  const { attendeeName, surveyTitle, eventTitle, surveyUrl } = options;
  const firstName = attendeeName?.split(" ")[0] || "there";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
      <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 20px;">We'd love your feedback!</h2>
      <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 15px; line-height: 1.5;">
        Hi ${firstName}, thank you for attending <strong style="color: #374151;">${eventTitle}</strong>.
        We'd really appreciate it if you took a moment to share your experience.
      </p>
      <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 15px; line-height: 1.5;">
        <strong style="color: #374151;">${surveyTitle}</strong>
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${surveyUrl}" style="display: inline-block; background-color: #465FFF; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
          Take the Survey
        </a>
      </div>
      <p style="color: #9CA3AF; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
        Or copy and paste this link into your browser:<br/>
        <a href="${surveyUrl}" style="color: #465FFF; word-break: break-all;">${surveyUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0 16px 0;" />
      <p style="color: #D1D5DB; font-size: 12px; margin: 0;">
        This survey was sent because you attended ${eventTitle}.
      </p>
    </div>
  `;
}

// POST - Send survey to event attendees
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for forms (surveys reuse forms access)
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const formsAccess = checkFeatureAccess(planInfo.planType, "forms");
    if (!formsAccess.allowed) {
      return NextResponse.json(
        {
          error: formsAccess.reason,
          upgrade_required: formsAccess.upgrade_required,
          feature: "forms",
        },
        { status: 403 }
      );
    }

    // Fetch the survey with its form slug
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("*, forms:form_id(slug, status)")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    if (!survey.event_id) {
      return NextResponse.json(
        { error: "Survey is not linked to an event" },
        { status: 400 }
      );
    }

    // Get the form slug for the public survey URL
    const formData = survey.forms as { slug: string | null; status: string } | null;
    const formSlug = formData?.slug;

    if (!formSlug) {
      return NextResponse.json(
        { error: "Survey form does not have a public link. Please publish the form first." },
        { status: 400 }
      );
    }

    // Ensure the form is published
    if (formData?.status !== "published") {
      await supabase
        .from("forms")
        .update({ status: "published" })
        .eq("id", survey.form_id);
    }

    // Fetch the linked event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, status")
      .eq("id", survey.event_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Linked event not found" },
        { status: 404 }
      );
    }

    // Fetch event attendees with email info
    const { data: attendees, error: attendeesError } = await supabase
      .from("event_attendees")
      .select("id, name, email, user_id")
      .eq("event_id", survey.event_id);

    if (attendeesError) {
      return NextResponse.json(
        { error: attendeesError.message },
        { status: 500 }
      );
    }

    const recipients = (attendees || []).filter(
      (a: { email?: string }) => a.email
    );

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No attendees with email addresses found for this event" },
        { status: 400 }
      );
    }

    // Build the public survey URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const surveyUrl = `${appUrl}/form/${formSlug}`;

    // Send emails to all recipients
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      const r = recipient as { id: string; name?: string; email: string };

      const html = buildSurveyEmailHtml({
        attendeeName: r.name || "",
        surveyTitle: survey.title,
        eventTitle: event.title,
        surveyUrl,
      });

      const sent = await sendEmail({
        to: r.email,
        subject: `Your feedback matters: ${survey.title}`,
        html,
        tenantId: profile.tenant_id,
      });

      if (sent) {
        successCount++;
      } else {
        failCount++;
        console.error(`[SURVEY SEND] Failed to send to ${r.email}`);
      }
    }

    // Update survey sent_count and status
    const { error: updateError } = await supabase
      .from("surveys")
      .update({
        sent_count: (survey.sent_count || 0) + successCount,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (updateError) {
      console.error("Update survey sent_count error:", updateError);
    }

    return NextResponse.json({
      sent_count: successCount,
      failed_count: failCount,
      total_recipients: recipients.length,
      survey_url: surveyUrl,
    });
  } catch (error) {
    console.error("Send survey error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
