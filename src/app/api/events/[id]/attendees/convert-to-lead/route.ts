import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Convert attendee to CRM lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attendeeId, notes, priority = "medium", source } = body;

    if (!attendeeId) {
      return NextResponse.json({ error: "Attendee ID is required" }, { status: 400 });
    }

    // Get attendee details
    const { data: attendee, error: attendeeError } = await supabase
      .from("event_attendees")
      .select("*")
      .eq("id", attendeeId)
      .eq("event_id", eventId)
      .single();

    if (attendeeError || !attendee) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 });
    }

    // Get event details for source
    const { data: event } = await supabase
      .from("events")
      .select("title, tenant_id")
      .eq("id", eventId)
      .single();

    // Check if lead already exists with this email
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", attendee.email)
      .eq("tenant_id", event?.tenant_id)
      .single();

    if (existingLead) {
      return NextResponse.json({
        error: "Lead with this email already exists",
        leadId: existingLead.id
      }, { status: 400 });
    }

    // Create lead from attendee
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        tenant_id: event?.tenant_id,
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        company: attendee.company,
        job_title: attendee.job_title,
        source: source || "event",
        campaign: event?.title || "Event Registration",
        status: "new",
        priority,
        notes: notes || `Converted from event attendee. Original event: ${event?.title}`,
        created_by: user.id,
        assigned_to: user.id,
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    return NextResponse.json({
      lead,
      message: "Successfully converted attendee to lead"
    }, { status: 201 });
  } catch (error) {
    console.error("Error in convert-to-lead API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
