import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for public judge access (no auth required - token-based)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get judge dashboard data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find judge by access token
    const { data: judge, error: judgeError } = await supabase
      .from("event_judges")
      .select(`
        id,
        email,
        name,
        status,
        event_id
      `)
      .eq("access_token", token)
      .single();

    if (judgeError || !judge) {
      return NextResponse.json({ error: "Invalid or expired access token" }, { status: 404 });
    }

    // Update last accessed
    await supabase
      .from("event_judges")
      .update({
        last_accessed_at: new Date().toISOString(),
        status: judge.status === "pending" ? "active" : judge.status
      })
      .eq("id", judge.id);

    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        event_type,
        color,
        judging_status,
        requirements
      `)
      .eq("id", judge.event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all submitted submissions
    const { data: submissions } = await supabase
      .from("event_submissions")
      .select(`
        id,
        title,
        description,
        project_url,
        demo_url,
        video_url,
        technologies,
        screenshots,
        submitted_at,
        team:event_teams (
          id,
          name,
          logo_url
        ),
        attendee:event_attendees (
          id,
          name,
          avatar_url
        ),
        files:event_submission_files (
          id,
          file_name,
          file_url,
          file_type
        )
      `)
      .eq("event_id", event.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });

    // Get existing scores by this judge
    const { data: existingScores } = await supabase
      .from("submission_scores")
      .select("*")
      .eq("judge_id", judge.id);

    const scoresBySubmission = new Map(
      (existingScores || []).map(s => [s.submission_id, s])
    );

    // Combine submissions with scores
    const submissionsWithScores = (submissions || []).map(sub => ({
      ...sub,
      myScore: scoresBySubmission.get(sub.id) || null,
    }));

    // Extract judging criteria
    const judgingCriteria = event.requirements?.judging_criteria ||
                           event.requirements?.judging_categories ||
                           [];

    return NextResponse.json({
      judge: {
        id: judge.id,
        name: judge.name,
        email: judge.email,
      },
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.event_type,
        color: event.color,
        judging_status: event.judging_status,
      },
      judgingCriteria,
      submissions: submissionsWithScores,
      stats: {
        total: submissionsWithScores.length,
        scored: submissionsWithScores.filter(s => s.myScore).length,
        pending: submissionsWithScores.filter(s => !s.myScore).length,
      },
    });
  } catch (error) {
    console.error("Error fetching judge dashboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
