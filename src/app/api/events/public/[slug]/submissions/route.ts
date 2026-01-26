import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../auth/route";

interface SubmissionWithRelations {
  id: string;
  title: string;
  description?: string;
  project_url?: string;
  demo_url?: string;
  video_url?: string;
  technologies?: string[];
  categories?: string[];
  screenshots?: string[];
  status: string;
  submitted_at?: string;
  created_at: string;
  team?: { id: string; name: string; logo_url?: string } | null;
  attendee?: { id: string; name: string; avatar_url?: string } | null;
}

// GET - List all submissions for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Check for auth token to see own submissions
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    let attendeeId: string | null = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        attendeeId = payload.attendeeId;
      }
    }

    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("id, is_public, is_published")
      .eq("slug", slug)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get submissions - public ones and own drafts
    let query = supabase
      .from("event_submissions")
      .select(`
        id, title, description, project_url, demo_url, video_url,
        technologies, categories, screenshots, status, submitted_at, created_at,
        team:team_id(id, name, logo_url),
        attendee:attendee_id(id, name, avatar_url)
      `)
      .eq("event_id", event.id)
      .order("submitted_at", { ascending: false, nullsFirst: false });

    // If not authenticated, only show submitted/winner submissions
    if (!attendeeId) {
      query = query.in("status", ["submitted", "accepted", "winner"]);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    // Cast to proper type and filter drafts to only show user's own
    const typedSubmissions = (submissions || []) as unknown as SubmissionWithRelations[];
    const filteredSubmissions = typedSubmissions.filter(sub => {
      if (sub.status === "draft") {
        return sub.attendee?.id === attendeeId ||
               (sub.team && attendeeId); // Team members can see their team's drafts
      }
      return true;
    });

    return NextResponse.json({ submissions: filteredSubmissions || [] });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new submission
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

    // Check if user is in a team (for team-required events)
    const requirements = event.requirements as Record<string, unknown> || {};
    const minTeamSize = (requirements.team_size_min as number) || 1;

    let teamId: string | null = null;

    if (minTeamSize > 1) {
      // Must be in a team
      const { data: membership } = await supabase
        .from("event_team_members")
        .select("team_id, role")
        .eq("attendee_id", payload.attendeeId)
        .eq("status", "active")
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: "You must be in a team to submit" },
          { status: 400 }
        );
      }

      teamId = membership.team_id;

      // Check if team already has a submission
      const { data: existingSubmission } = await supabase
        .from("event_submissions")
        .select("id")
        .eq("event_id", event.id)
        .eq("team_id", teamId)
        .single();

      if (existingSubmission) {
        return NextResponse.json(
          { error: "Your team already has a submission. Edit the existing one instead." },
          { status: 400 }
        );
      }
    } else {
      // Solo submission - check for existing
      const { data: existingSubmission } = await supabase
        .from("event_submissions")
        .select("id")
        .eq("event_id", event.id)
        .eq("attendee_id", payload.attendeeId)
        .is("team_id", null)
        .single();

      if (existingSubmission) {
        return NextResponse.json(
          { error: "You already have a submission. Edit the existing one instead." },
          { status: 400 }
        );
      }
    }

    const {
      title,
      description,
      project_url,
      demo_url,
      video_url,
      repository_url,
      presentation_url,
      technologies,
      categories,
      screenshots,
    } = body;

    // Create submission
    const { data: submission, error: createError } = await supabase
      .from("event_submissions")
      .insert({
        event_id: event.id,
        team_id: teamId,
        attendee_id: teamId ? null : payload.attendeeId,
        title,
        description,
        project_url,
        demo_url,
        video_url,
        repository_url,
        presentation_url,
        technologies: technologies || [],
        categories: categories || [],
        screenshots: screenshots || [],
        status: "draft",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating submission:", createError);
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
    }

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error("Create submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
