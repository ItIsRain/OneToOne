import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";

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
    const { attendeeId, notes, priority = "medium", source } = body;

    if (!attendeeId) {
      return NextResponse.json({ error: "Attendee ID is required" }, { status: 400 });
    }

    // Get event details and verify it belongs to user's tenant
    const { data: event } = await supabase
      .from("events")
      .select("title, tenant_id")
      .eq("id", eventId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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

    // Check if lead already exists with this email (only if attendee has email)
    if (attendee.email) {
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", attendee.email)
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (existingLead) {
        return NextResponse.json({
          error: "Lead with this email already exists",
          leadId: existingLead.id
        }, { status: 400 });
      }
    }

    // Create lead from attendee
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        tenant_id: profile.tenant_id,
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

    // Fire lead_created workflow trigger
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers(
          "lead_created",
          {
            entity_id: lead.id,
            entity_type: "lead",
            entity_name: lead.name,
            lead_name: lead.name,
            lead_email: lead.email || null,
            lead_company: lead.company || null,
            lead_source: lead.source || "event",
            lead_estimated_value: lead.estimated_value || null,
          },
          serviceClient,
          profile.tenant_id,
          user.id
        );
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
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
