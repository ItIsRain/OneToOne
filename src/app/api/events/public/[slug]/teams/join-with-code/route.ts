import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../auth/route";

// POST - Join a team using a code
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
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Join code is required" }, { status: 400 });
    }

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is already in a team
    const { data: existingMembership } = await supabase
      .from("event_team_members")
      .select("id, team_id")
      .eq("attendee_id", payload.attendeeId)
      .eq("status", "active")
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already in a team" },
        { status: 400 }
      );
    }

    // Find team with matching join code
    const { data: team, error: teamError } = await supabase
      .from("event_teams")
      .select(`
        id, name, max_members, join_type, join_code,
        members:event_team_members(id)
      `)
      .eq("event_id", event.id)
      .eq("join_code", code.toUpperCase())
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
    }

    // Check if team accepts code-based joins
    if (team.join_type !== "code") {
      return NextResponse.json(
        { error: "This team does not accept code-based joins" },
        { status: 400 }
      );
    }

    // Check if team is full
    const memberCount = team.members?.length || 0;
    if (memberCount >= team.max_members) {
      return NextResponse.json({ error: "Team is full" }, { status: 400 });
    }

    // Join the team
    const { error: joinError } = await supabase
      .from("event_team_members")
      .insert({
        team_id: team.id,
        attendee_id: payload.attendeeId,
        role: "member",
        status: "active",
      });

    if (joinError) {
      console.error("Join team error:", joinError);
      return NextResponse.json({ error: "Failed to join team" }, { status: 500 });
    }

    // Update attendee
    await supabase
      .from("event_attendees")
      .update({ looking_for_team: false })
      .eq("id", payload.attendeeId);

    return NextResponse.json({
      success: true,
      message: `Joined team "${team.name}" successfully`,
      teamId: team.id
    });
  } catch (error) {
    console.error("Join with code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
