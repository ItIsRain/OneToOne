import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for public judge access (no auth required - token-based)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Submit or update a score
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Verify judge token
    const { data: judge, error: judgeError } = await supabase
      .from("event_judges")
      .select("id, event_id, status")
      .eq("access_token", token)
      .single();

    if (judgeError || !judge) {
      return NextResponse.json({ error: "Invalid or expired access token" }, { status: 404 });
    }

    // Check if judging is still in progress
    const { data: event } = await supabase
      .from("events")
      .select("judging_status")
      .eq("id", judge.event_id)
      .single();

    if (!event || event.judging_status !== "in_progress") {
      return NextResponse.json(
        { error: "Judging is not currently in progress" },
        { status: 400 }
      );
    }

    const { submissionId, criteriaScores, feedback } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Verify submission belongs to this event
    const { data: submission } = await supabase
      .from("event_submissions")
      .select("id")
      .eq("id", submissionId)
      .eq("event_id", judge.event_id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Calculate total score
    let totalScore = 0;
    if (criteriaScores && typeof criteriaScores === "object") {
      const scores = Object.values(criteriaScores) as number[];
      totalScore = scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length;
    }

    // Upsert score
    const { data: score, error: scoreError } = await supabase
      .from("submission_scores")
      .upsert(
        {
          submission_id: submissionId,
          judge_id: judge.id,
          criteria_scores: criteriaScores || {},
          feedback: feedback || null,
          total_score: totalScore,
          scored_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "submission_id,judge_id",
        }
      )
      .select()
      .single();

    if (scoreError) {
      console.error("Error saving score:", scoreError);
      return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }

    // Update judge status if this is their first score
    if (judge.status !== "active") {
      await supabase
        .from("event_judges")
        .update({ status: "active" })
        .eq("id", judge.id);
    }

    return NextResponse.json({
      success: true,
      score: {
        id: score.id,
        submission_id: score.submission_id,
        criteria_scores: score.criteria_scores,
        feedback: score.feedback,
        total_score: score.total_score,
        scored_at: score.scored_at,
      },
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Get all scores by this judge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Verify judge token
    const { data: judge } = await supabase
      .from("event_judges")
      .select("id")
      .eq("access_token", token)
      .single();

    if (!judge) {
      return NextResponse.json({ error: "Invalid or expired access token" }, { status: 404 });
    }

    const { data: scores } = await supabase
      .from("submission_scores")
      .select("*")
      .eq("judge_id", judge.id);

    return NextResponse.json({ scores: scores || [] });
  } catch (error) {
    console.error("Error fetching scores:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
