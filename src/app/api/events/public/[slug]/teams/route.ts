import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../auth/route";

// GET - List all teams for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Get event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, is_public, is_published")
      .eq("slug", slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.is_public || !event.is_published) {
      return NextResponse.json({ error: "Event not accessible" }, { status: 403 });
    }

    // Get all teams with member count
    const { data: teams, error: teamsError } = await supabase
      .from("event_teams")
      .select(`
        id, name, description, logo_url, max_members, is_open,
        looking_for_members, skills_needed, created_at, join_type, join_code,
        members:event_team_members(
          id,
          role,
          status,
          attendee:attendee_id(id, name, avatar_url, skills)
        )
      `)
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }

    // Filter to only active members and format response
    const formattedTeams = teams?.map(team => {
      const activeMembers = (team.members || []).filter(
        (m: { attendee: unknown; status?: string }) => m.attendee && m.status === 'active'
      );
      return {
        ...team,
        // Use actual join_type from DB, fallback to is_open for backwards compatibility
        join_type: team.join_type || (team.is_open ? 'open' : 'invite_only'),
        // Don't expose join_code in list view
        join_code: undefined,
        members: activeMembers,
        memberCount: activeMembers.length,
      };
    });

    return NextResponse.json({ teams: formattedTeams || [] });
  } catch (error) {
    console.error("Teams fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id, requirements")
      .eq("slug", slug)
      .single();

    if (!event || event.id !== payload.eventId) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    // Check if attendee is already in a team
    const { data: existingMembership } = await supabase
      .from("event_team_members")
      .select("id")
      .eq("attendee_id", payload.attendeeId)
      .eq("status", "active")
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already in a team. Leave your current team first." },
        { status: 400 }
      );
    }

    const { name, description, skills_needed, max_members, join_type } = body;

    // Get max team size from event requirements
    const requirements = event.requirements as Record<string, unknown> || {};
    const maxTeamSize = (requirements.team_size_max as number) || max_members || 5;

    // Determine is_open based on join_type (if provided)
    const validJoinTypes = ['open', 'code', 'invite_only'];
    const teamJoinType = validJoinTypes.includes(join_type) ? join_type : 'open';
    const isOpen = teamJoinType === 'open';

    // Generate join code if join_type is 'code'
    const joinCode = teamJoinType === 'code'
      ? Math.random().toString(36).substring(2, 8).toUpperCase()
      : null;

    // Create team
    const { data: team, error: teamError } = await supabase
      .from("event_teams")
      .insert({
        event_id: event.id,
        name,
        description: description || null,
        skills_needed: skills_needed || [],
        max_members: maxTeamSize,
        is_open: isOpen,
        looking_for_members: true,
        created_by: payload.attendeeId,
        join_type: teamJoinType,
        join_code: joinCode,
      })
      .select()
      .single();

    if (teamError) {
      if (teamError.code === "23505") {
        return NextResponse.json(
          { error: "A team with this name already exists" },
          { status: 400 }
        );
      }
      console.error("Error creating team:", teamError);
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }

    // Add creator as team leader
    const { error: memberError } = await supabase
      .from("event_team_members")
      .insert({
        team_id: team.id,
        attendee_id: payload.attendeeId,
        role: "leader",
        status: "active",
      });

    if (memberError) {
      console.error("Error adding team leader:", memberError);
      // Clean up team if member add fails
      await supabase.from("event_teams").delete().eq("id", team.id);
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }

    // Update attendee to not looking for team
    await supabase
      .from("event_attendees")
      .update({ looking_for_team: false })
      .eq("id", payload.attendeeId);

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
