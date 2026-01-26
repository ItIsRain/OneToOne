import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../auth/route";

// GET - List attendees (for team formation)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id, is_public, is_published")
      .eq("slug", slug)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.is_public || !event.is_published) {
      return NextResponse.json({ error: "Event not accessible" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const lookingForTeam = searchParams.get("looking_for_team");
    const skills = searchParams.get("skills");

    let query = supabase
      .from("event_attendees")
      .select(`
        id, name, avatar_url, company, job_title, skills, bio,
        looking_for_team, registered_at
      `)
      .eq("event_id", event.id)
      .eq("status", "confirmed")
      .order("registered_at", { ascending: false });

    if (lookingForTeam === "true") {
      query = query.eq("looking_for_team", true);
    }

    const { data: attendees, error } = await query;

    if (error) {
      console.error("Error fetching attendees:", error);
      return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
    }

    // Filter by skills if provided
    let filteredAttendees = attendees || [];
    if (skills) {
      const skillList = skills.split(",").map(s => s.trim().toLowerCase());
      filteredAttendees = filteredAttendees.filter(a => {
        const attendeeSkills = (a.skills as string[] || []).map(s => s.toLowerCase());
        return skillList.some(skill => attendeeSkills.includes(skill));
      });
    }

    return NextResponse.json({ attendees: filteredAttendees });
  } catch (error) {
    console.error("Get attendees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update attendee profile
export async function PATCH(
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

    const {
      name,
      phone,
      company,
      job_title,
      avatar_url,
      skills,
      bio,
      social_links,
      looking_for_team,
    } = body;

    const { data: attendee, error } = await supabase
      .from("event_attendees")
      .update({
        name,
        phone,
        company,
        job_title,
        avatar_url,
        skills,
        bio,
        social_links,
        looking_for_team,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.attendeeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating attendee:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ attendee });
  } catch (error) {
    console.error("Update attendee error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
