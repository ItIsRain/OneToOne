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

    // Check if requester is authenticated (to show join_code to leaders only)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    let currentAttendeeId: string | null = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        currentAttendeeId = payload.attendeeId;
      }
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

    // Check if current user is the team leader
    const isLeader = currentAttendeeId && team.members?.some(
      (m: { attendee: { id: string } | null; role: string; status: string }) =>
        m.attendee?.id === currentAttendeeId && m.role === "leader" && m.status === "active"
    );

    // Format response - only include join_code for team leaders
    const teamResponse = {
      ...team,
      join_type: team.join_type || (team.is_open ? 'open' : 'invite_only'),
      // Only expose join_code to team leaders
      join_code: isLeader ? team.join_code : undefined,
    };

    return NextResponse.json({ team: teamResponse });
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
    const { name, description, skills_needed, is_open, looking_for_members, logo_url, join_type, join_code, generate_new_code } = body;

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (skills_needed !== undefined) updateData.skills_needed = skills_needed;
    if (looking_for_members !== undefined) updateData.looking_for_members = looking_for_members;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    // Handle join_type and join_code
    if (join_type) {
      updateData.join_type = join_type;
      updateData.is_open = join_type === 'open';

      if (join_type === 'code') {
        if (generate_new_code) {
          // Generate a new join code
          updateData.join_code = Math.random().toString(36).substring(2, 8).toUpperCase();
        } else if (join_code) {
          updateData.join_code = join_code.toUpperCase();
        }
      } else {
        // Clear join code for non-code join types
        updateData.join_code = null;
      }
    } else if (is_open !== undefined) {
      updateData.is_open = is_open;
      updateData.join_type = is_open ? 'open' : 'invite_only';
    }

    const { data: team, error } = await supabase
      .from("event_teams")
      .update(updateData)
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

      // Check if team is open for joining
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
        // Check if there are other active members
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
          // First mark the current member as left
          await supabase
            .from("event_team_members")
            .update({ status: "left" })
            .eq("id", membership.id);

          // Then delete the team (no other active members)
          const { error: deleteError } = await supabase
            .from("event_teams")
            .delete()
            .eq("id", teamId);

          if (deleteError) {
            console.error("Error deleting team:", deleteError);
          }

          // Update attendee
          await supabase
            .from("event_attendees")
            .update({ looking_for_team: true })
            .eq("id", payload.attendeeId);

          return NextResponse.json({ success: true, message: "Left team successfully. Team was deleted." });
        }
      }

      // Remove from team (for non-leaders, or leaders when there are other members)
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
