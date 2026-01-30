import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkTriggers } from "@/lib/workflows/triggers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    const { data: event, error } = await supabase
      .from("events")
      .select(`
        *,
        client:client_id(id, name, company, email, phone),
        venue:venue_id(id, name, address, city, capacity, amenities, hourly_rate)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch assignee and creator info
    let assignee = null;
    let creator = null;

    if (event.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, email")
        .eq("id", event.assigned_to)
        .single();
      assignee = data;
    }

    if (event.created_by) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", event.created_by)
        .single();
      creator = data;
    }

    // Fetch attendees count
    const { count: attendeesCount } = await supabase
      .from("event_attendees")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id)
      .in("status", ["confirmed", "attended"]);

    return NextResponse.json({
      ...event,
      assignee,
      creator,
      confirmed_attendees: attendeesCount || 0,
    });
  } catch (error) {
    console.error("Error in event GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    const body = await request.json();

    // Process dates if they come as separate date and time
    const updateData = { ...body };

    if (body.date && body.start_time && !body.start_date) {
      updateData.start_date = `${body.date}T${body.start_time}:00`;
    }
    if (body.end_date_value && body.end_time && !body.end_date) {
      updateData.end_date = `${body.end_date_value}T${body.end_time}:00`;
    } else if (body.date && body.end_time && !body.end_date) {
      updateData.end_date = `${body.date}T${body.end_time}:00`;
    }

    // Remove helper fields
    delete updateData.date;
    delete updateData.end_date_value;

    const { data: event, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:client_id(id, name, company, email),
        venue:venue_id(id, name, address, city, capacity)
      `)
      .single();

    if (error) {
      console.error("Error updating event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch assignee and creator info
    let assignee = null;
    let creator = null;

    if (event.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, email")
        .eq("id", event.assigned_to)
        .single();
      assignee = data;
    }

    if (event.created_by) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", event.created_by)
        .single();
      creator = data;
    }

    // Fire event_ended trigger and auto-send surveys when event status changes to "completed"
    if (body.status === "completed") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("event_ended", {
            entity_id: event.id,
            entity_type: "event",
            entity_name: event.title,
            event_id: event.id,
            event_title: event.title,
            event_type: event.event_type,
            event_end_date: event.end_date,
            attendees_count: event.attendees_count,
          }, serviceClient, profile.tenant_id, user.id);

          // Auto-activate and record surveys linked to this event with auto_send enabled
          const { data: linkedSurveys } = await serviceClient
            .from("surveys")
            .select("id, form_id, send_delay_minutes, status")
            .eq("event_id", event.id)
            .eq("auto_send_on_event_end", true)
            .in("status", ["draft", "active"]);

          if (linkedSurveys?.length) {
            // Fetch event attendees for sending emails
            const { data: attendeesList } = await serviceClient
              .from("event_attendees")
              .select("id, name, email")
              .eq("event_id", event.id);

            const emailRecipients = (attendeesList || []).filter(
              (a: { email?: string }) => a.email
            );

            for (const survey of linkedSurveys) {
              // Activate draft surveys
              if (survey.status === "draft") {
                await serviceClient
                  .from("surveys")
                  .update({ status: "active" })
                  .eq("id", survey.id);
              }
              // Publish the underlying form
              await serviceClient
                .from("forms")
                .update({ status: "published" })
                .eq("id", survey.form_id);

              // Actually send emails to attendees
              if (emailRecipients.length > 0) {
                try {
                  // Get the form slug for the public URL
                  const { data: formData } = await serviceClient
                    .from("forms")
                    .select("slug")
                    .eq("id", survey.form_id)
                    .single();

                  if (formData?.slug) {
                    const { sendEmail } = await import("@/lib/email");
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                    const surveyUrl = `${appUrl}/form/${formData.slug}`;

                    // Get survey title
                    const { data: surveyInfo } = await serviceClient
                      .from("surveys")
                      .select("title")
                      .eq("id", survey.id)
                      .single();

                    let sentCount = 0;
                    for (const attendee of emailRecipients) {
                      const a = attendee as { name?: string; email: string };
                      const firstName = a.name?.split(" ")[0] || "there";

                      const html = `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
                          <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 20px;">We'd love your feedback!</h2>
                          <p style="color: #6B7280; margin: 0 0 24px 0; font-size: 15px; line-height: 1.5;">
                            Hi ${firstName}, thank you for attending <strong style="color: #374151;">${event.title}</strong>.
                            We'd really appreciate it if you took a moment to share your experience.
                          </p>
                          <div style="text-align: center; margin: 32px 0;">
                            <a href="${surveyUrl}" style="display: inline-block; background-color: #465FFF; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                              Take the Survey
                            </a>
                          </div>
                          <p style="color: #9CA3AF; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
                            Or copy this link: <a href="${surveyUrl}" style="color: #465FFF; word-break: break-all;">${surveyUrl}</a>
                          </p>
                        </div>
                      `;

                      const sent = await sendEmail({
                        to: a.email,
                        subject: `Your feedback matters: ${surveyInfo?.title || "Survey"}`,
                        html,
                        tenantId: profile.tenant_id,
                      });
                      if (sent) sentCount++;
                    }

                    // Update sent_count on survey
                    if (sentCount > 0) {
                      const { data: currentSurvey } = await serviceClient
                        .from("surveys")
                        .select("sent_count")
                        .eq("id", survey.id)
                        .single();

                      await serviceClient
                        .from("surveys")
                        .update({ sent_count: (currentSurvey?.sent_count || 0) + sentCount })
                        .eq("id", survey.id);
                    }
                  }
                } catch (emailErr) {
                  console.error("Auto-send survey email error:", emailErr);
                }
              }
            }
          }
        } catch (err) {
          console.error("Event ended trigger/survey auto-send error:", err);
        }
      }
    }

    return NextResponse.json({ ...event, assignee, creator });
  } catch (error) {
    console.error("Error in event PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Error deleting event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in event DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
