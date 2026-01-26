import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkAttendeeLimit } from "@/lib/plan-limits";

// GET - List all attendees for an event (admin only)
export async function GET(
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

    // Verify user has access to this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, event_type, tenant_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const lookingForTeam = searchParams.get("looking_for_team");

    // Build query
    let query = supabase
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
        status,
        looking_for_team,
        registered_at,
        last_login_at,
        updated_at
      `)
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (lookingForTeam === "true") {
      query = query.eq("looking_for_team", true);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data: attendees, error } = await query;

    if (error) {
      console.error("Error fetching attendees:", error);
      return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
    }

    // Get team memberships for each attendee
    const attendeeIds = attendees?.map(a => a.id) || [];
    const { data: teamMembers } = await supabase
      .from("event_team_members")
      .select(`
        attendee_id,
        role,
        team:event_teams(id, name)
      `)
      .in("attendee_id", attendeeIds);

    // Get submissions for each attendee/team
    const { data: submissions } = await supabase
      .from("event_submissions")
      .select(`
        id,
        title,
        status,
        attendee_id,
        team_id
      `)
      .eq("event_id", eventId);

    // Merge data
    const enrichedAttendees = attendees?.map(attendee => {
      const teamMember = teamMembers?.find(tm => tm.attendee_id === attendee.id);
      // Extract team data (Supabase returns relation as array or object depending on version)
      const teamData = teamMember?.team
        ? Array.isArray(teamMember.team)
          ? teamMember.team[0]
          : teamMember.team
        : null;
      const teamId = teamData?.id;

      const submission = submissions?.find(s =>
        s.attendee_id === attendee.id ||
        (teamId && s.team_id === teamId)
      );

      return {
        ...attendee,
        team: teamData,
        team_role: teamMember?.role || null,
        submission: submission || null,
      };
    });

    // Get stats
    const stats = {
      total: attendees?.length || 0,
      confirmed: attendees?.filter(a => a.status === "confirmed").length || 0,
      attended: attendees?.filter(a => a.status === "attended").length || 0,
      no_show: attendees?.filter(a => a.status === "no_show").length || 0,
      cancelled: attendees?.filter(a => a.status === "cancelled").length || 0,
      looking_for_team: attendees?.filter(a => a.looking_for_team).length || 0,
    };

    return NextResponse.json({
      attendees: enrichedAttendees,
      stats,
      event: {
        id: event.id,
        title: event.title,
        event_type: event.event_type,
      },
    });
  } catch (error) {
    console.error("Error in attendees API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add attendee manually (admin only)
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
    const { email, name, phone, company, job_title, skills, bio, status = "confirmed" } = body;

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    // Check plan limits for attendees per event
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const attendeeLimitCheck = await checkAttendeeLimit(supabase, eventId, planInfo.planType);
    if (!attendeeLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: attendeeLimitCheck.reason,
          current: attendeeLimitCheck.current,
          limit: attendeeLimitCheck.limit,
          upgrade_required: attendeeLimitCheck.upgrade_required,
        },
        { status: 403 }
      );
    }

    // Check if attendee already exists
    const { data: existing } = await supabase
      .from("event_attendees")
      .select("id")
      .eq("event_id", eventId)
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Attendee with this email already registered" }, { status: 400 });
    }

    // Create attendee
    const { data: attendee, error } = await supabase
      .from("event_attendees")
      .insert({
        event_id: eventId,
        email: email.toLowerCase(),
        name,
        phone,
        company,
        job_title,
        skills: skills || [],
        bio,
        status,
        registered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating attendee:", error);
      return NextResponse.json({ error: "Failed to create attendee" }, { status: 500 });
    }

    // Update event attendee count
    await supabase.rpc("increment_attendee_count", { event_id: eventId });

    return NextResponse.json({ attendee }, { status: 201 });
  } catch (error) {
    console.error("Error in attendees API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
