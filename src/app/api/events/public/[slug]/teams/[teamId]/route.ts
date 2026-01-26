import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../auth/route";

// GET - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; teamId: string }> }
) {
  try {
    const { slug, teamId } = await params;
    const supabase = await createClient();

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get team with members
    const { data: team, error } = await supabase
      .from("event_teams")
      .select(`
        *,
        members:event_team_members(
          id, role, joined_at, status,
          attendee:attendee_id(id, name, email, avatar_url, skills, bio, company)
        )
      `)
      .eq("id", teamId)
      .eq("event_id", event.id)
      .single();

    if (error || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update team
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; teamId: string }> }
) {
  try {
    const { slug, teamId } = await params;
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

    // Check if user is team leader
    const { data: membership } = await supabase
      .from("event_team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("attendee_id", payload.attendeeId)
      .eq("status", "active")
      .single();

    if (!membership || membership.role !== "leader") {
      return NextResponse.json(
        { error: "Only team leaders can update the team" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, skills_needed, is_open, looking_for_members, logo_url } = body;

    const { data: team, error } = await supabase
      .from("event_teams")
      .update({
        name,
        description,
        skills_needed,
        is_open,
        looking_for_members,
        logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)
      .select()
      .single();

    if (error) {
      console.error("Update team error:", error);
      return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Join team or leave team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; teamId: string }> }
) {
  try {
    const { slug, teamId } = await params;
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
    const { action } = body;

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (action === "join") {
      // Check if already in a team
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

      // Get team and check if open
      const { data: team } = await supabase
        .from("event_teams")
        .select(`
          id, max_members, is_open,
          members:event_team_members(id)
        `)
        .eq("id", teamId)
        .eq("event_id", event.id)
        .single();

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (!team.is_open) {
        return NextResponse.json(
          { error: "This team is not accepting new members" },
          { status: 400 }
        );
      }

      const memberCount = team.members?.length || 0;
      if (memberCount >= team.max_members) {
        return NextResponse.json(
          { error: "Team is full" },
          { status: 400 }
        );
      }

      // Join team
      const { error: joinError } = await supabase
        .from("event_team_members")
        .insert({
          team_id: teamId,
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

      return NextResponse.json({ success: true, message: "Joined team successfully" });

    } else if (action === "leave") {
      // Get membership
      const { data: membership } = await supabase
        .from("event_team_members")
        .select("id, role, team_id")
        .eq("team_id", teamId)
        .eq("attendee_id", payload.attendeeId)
        .eq("status", "active")
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: "You are not a member of this team" },
          { status: 400 }
        );
      }

      // If leader, need to transfer leadership or delete team
      if (membership.role === "leader") {
        // Check if there are other members
        const { data: otherMembers } = await supabase
          .from("event_team_members")
          .select("id, attendee_id")
          .eq("team_id", teamId)
          .eq("status", "active")
          .neq("attendee_id", payload.attendeeId)
          .limit(1);

        if (otherMembers && otherMembers.length > 0) {
          // Transfer leadership to first member
          await supabase
            .from("event_team_members")
            .update({ role: "leader" })
            .eq("id", otherMembers[0].id);
        } else {
          // Delete the team if no other members
          await supabase.from("event_teams").delete().eq("id", teamId);
        }
      }

      // Remove from team
      await supabase
        .from("event_team_members")
        .update({ status: "left" })
        .eq("id", membership.id);

      // Update attendee
      await supabase
        .from("event_attendees")
        .update({ looking_for_team: true })
        .eq("id", payload.attendeeId);

      return NextResponse.json({ success: true, message: "Left team successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Team action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
