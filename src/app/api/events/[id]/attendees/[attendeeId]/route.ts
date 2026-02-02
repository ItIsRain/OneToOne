import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updateAttendeeSchema } from "@/lib/validations";

// GET - Get single attendee details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attendeeId: string }> }
) {
  try {
    const { id: eventId, attendeeId } = await params;
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

    // Verify tenant owns this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: attendee, error } = await supabase
      .from("event_attendees")
      .select(`
        id,
        email,
        name,
        phone,
        company,
        job_title,
        avatar_url,
        skills,
        bio,
        social_links,
        status,
        looking_for_team,
        registered_at,
        last_login_at,
        updated_at
      `)
      .eq("id", attendeeId)
      .eq("event_id", eventId)
      .single();

    if (error || !attendee) {
      return NextResponse.json({ error: "Attendee not found" }, { status: 404 });
    }

    // Get team membership
    const { data: teamMember } = await supabase
      .from("event_team_members")
      .select(`
        role,
        joined_at,
        team:event_teams(id, name, description, logo_url, max_members)
      `)
      .eq("attendee_id", attendeeId)
      .single();

    // Extract team data (Supabase returns relation as array or object depending on version)
    const teamData = teamMember?.team
      ? Array.isArray(teamMember.team)
        ? teamMember.team[0]
        : teamMember.team
      : null;
    const teamId = teamData?.id;

    // Get submission
    const { data: submission } = await supabase
      .from("event_submissions")
      .select("*")
      .eq("event_id", eventId)
      .or(`attendee_id.eq.${attendeeId}${teamId ? `,team_id.eq.${teamId}` : ""}`)
      .single();

    return NextResponse.json({
      attendee: {
        ...attendee,
        team: teamData,
        team_role: teamMember?.role || null,
        submission: submission || null,
      },
    });
  } catch (error) {
    console.error("Error in attendee API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update attendee (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attendeeId: string }> }
) {
  try {
    const { id: eventId, attendeeId } = await params;
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

    // Verify tenant owns this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateAttendeeSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const allowedFields = ["name", "phone", "company", "job_title", "skills", "bio", "status", "looking_for_team"];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    updateData.updated_at = new Date().toISOString();

    const { data: attendee, error } = await supabase
      .from("event_attendees")
      .update(updateData)
      .eq("id", attendeeId)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) {
      console.error("Error updating attendee:", error);
      return NextResponse.json({ error: "Failed to update attendee" }, { status: 500 });
    }

    return NextResponse.json({ attendee });
  } catch (error) {
    console.error("Error in attendee API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove attendee (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attendeeId: string }> }
) {
  try {
    const { id: eventId, attendeeId } = await params;
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

    // Verify tenant owns this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Remove from team first
    await supabase
      .from("event_team_members")
      .delete()
      .eq("attendee_id", attendeeId);

    // Delete attendee
    const { error } = await supabase
      .from("event_attendees")
      .delete()
      .eq("id", attendeeId)
      .eq("event_id", eventId);

    if (error) {
      console.error("Error deleting attendee:", error);
      return NextResponse.json({ error: "Failed to delete attendee" }, { status: 500 });
    }

    // Update event attendee count
    await supabase.rpc("decrement_attendee_count", { event_id: eventId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in attendee API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
