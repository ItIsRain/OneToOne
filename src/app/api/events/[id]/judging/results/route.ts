import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Get judging results with rankings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Verify event belongs to tenant
    const { data: event } = await supabase
      .from("events")
      .select("judging_status, requirements")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all submissions
    const { data: submissions } = await supabase
      .from("event_submissions")
      .select(`
        id,
        title,
        description,
        project_url,
        demo_url,
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
        )
      `)
      .eq("event_id", id)
      .eq("status", "submitted");

    // Get all scores
    const { data: allScores } = await supabase
      .from("submission_scores")
      .select(`
        id,
        submission_id,
        judge_id,
        criteria_scores,
        feedback,
        total_score,
        scored_at,
        judge:event_judges (
          id,
          name,
          email
        )
      `)
      .in("submission_id", submissions?.map(s => s.id) || []);

    // Get total judge count
    const { count: totalJudges } = await supabase
      .from("event_judges")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    // Calculate rankings
    const submissionsWithScores = submissions?.map(submission => {
      const scores = allScores?.filter(s => s.submission_id === submission.id) || [];
      const avgScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + (s.total_score || 0), 0) / scores.length
        : 0;

      return {
        ...submission,
        scores,
        average_score: Math.round(avgScore * 100) / 100,
        scores_received: scores.length,
        scores_pending: (totalJudges || 0) - scores.length,
      };
    }) || [];

    // Sort by average score (descending)
    submissionsWithScores.sort((a, b) => b.average_score - a.average_score);

    // Add rankings
    const rankedSubmissions = submissionsWithScores.map((submission, index) => ({
      ...submission,
      rank: index + 1,
    }));

    return NextResponse.json({
      judging_status: event.judging_status,
      judging_criteria: event.requirements?.judging_criteria || [],
      total_judges: totalJudges || 0,
      submissions: rankedSubmissions,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
