import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all submissions for an event (admin only)
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("event_submissions")
      .select(`
        id,
        title,
        description,
        project_url,
        demo_url,
        video_url,
        technologies,
        status,
        submitted_at,
        winner_place,
        winner_prize,
        judge_notes,
        score,
        created_at,
        updated_at,
        team:event_teams(id, name, logo_url),
        attendee:event_attendees(id, name, email, avatar_url)
      `)
      .eq("event_id", eventId)
      .order("submitted_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    // Get stats
    const stats = {
      total: submissions?.length || 0,
      draft: submissions?.filter(s => s.status === "draft").length || 0,
      submitted: submissions?.filter(s => s.status === "submitted").length || 0,
      winners: submissions?.filter(s => s.status === "winner").length || 0,
    };

    return NextResponse.json({ submissions, stats });
  } catch (error) {
    console.error("Error in submissions API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
