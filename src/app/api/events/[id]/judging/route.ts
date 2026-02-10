import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// Helper to get tenant and verify access
async function verifyAccess(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, email")
    .eq("id", userId)
    .single();

  if (!profile?.tenant_id) {
    return { error: "No tenant found", status: 400 };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title, judging_status, judging_started_at, submissions_locked, requirements")
    .eq("id", eventId)
    .eq("tenant_id", profile.tenant_id)
    .single();

  if (!event) {
    return { error: "Event not found", status: 404 };
  }

  return { odUserId: userId, profile, event };
}

// GET - Get judging status and judges for an event
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

    const access = await verifyAccess(supabase, id, userId);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { event, profile, odUserId } = access;

    // Check plan feature access for judging system
    const planInfo = await getUserPlanInfo(supabase, odUserId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const judgingAccess = checkFeatureAccess(planInfo.planType, "judging_system");
    if (!judgingAccess.allowed) {
      return NextResponse.json(
        {
          error: judgingAccess.reason,
          upgrade_required: judgingAccess.upgrade_required,
        },
        { status: 403 }
      );
    }

    // Get judges
    const { data: judges } = await supabase
      .from("event_judges")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    // Get all submissions for this event
    const { data: submissions } = await supabase
      .from("event_submissions")
      .select("id, title")
      .eq("event_id", id)
      .eq("status", "submitted");

    const submissionCount = submissions?.length || 0;
    const submissionIds = submissions?.map(s => s.id) || [];
    const submissionMap = new Map(submissions?.map(s => [s.id, s.title]) || []);

    // Get all scores for these submissions
    let allScores: any[] = [];
    if (submissionIds.length > 0) {
      const { data: scores } = await supabase
        .from("submission_scores")
        .select("*")
        .in("submission_id", submissionIds);
      allScores = scores || [];
    }

    // Build judges with their scores
    const judgesWithScores = (judges || []).map(judge => {
      const judgeScores = allScores.filter(s => s.judge_id === judge.id);
      const scoresWithTitles = judgeScores.map(score => ({
        submission_id: score.submission_id,
        submission_title: submissionMap.get(score.submission_id) || "Unknown",
        total_score: score.total_score,
        scored_at: score.scored_at,
      }));

      const avgScore = judgeScores.length > 0
        ? judgeScores.reduce((sum, s) => sum + (s.total_score || 0), 0) / judgeScores.length
        : 0;

      const completionPercent = submissionCount > 0
        ? Math.round((judgeScores.length / submissionCount) * 100)
        : 0;

      return {
        ...judge,
        scores: scoresWithTitles,
        scores_submitted: judgeScores.length,
        average_score: Math.round(avgScore * 10) / 10,
        completion_percent: completionPercent,
      };
    });

    const scoresCount = allScores.length;

    // Check if current user is a judge and get their judging URL
    const userEmail = profile.email;
    const userJudge = judgesWithScores.find(j => j.email.toLowerCase() === userEmail?.toLowerCase());
    const userJudgingUrl = userJudge?.access_token
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/judge/${userJudge.access_token}`
      : null;

    return NextResponse.json({
      judging_status: event.judging_status || "not_started",
      judging_started_at: event.judging_started_at,
      submissions_locked: event.submissions_locked || false,
      judging_criteria: event.requirements?.judging_criteria || [],
      judges: judgesWithScores,
      stats: {
        total_submissions: submissionCount,
        total_judges: judges?.length || 0,
        total_scores: scoresCount,
        active_judges: judges?.filter(j => j.status === "active").length || 0,
      },
      currentUser: {
        email: userEmail,
        isJudge: !!userJudge,
        judgingUrl: userJudgingUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching judging data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Start judging period
export async function POST(
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

    const access = await verifyAccess(supabase, id, userId);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { event, odUserId } = access;

    // Check plan feature access for judging system
    const planInfo = await getUserPlanInfo(supabase, odUserId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const judgingAccess = checkFeatureAccess(planInfo.planType, "judging_system");
    if (!judgingAccess.allowed) {
      return NextResponse.json(
        {
          error: judgingAccess.reason,
          upgrade_required: judgingAccess.upgrade_required,
        },
        { status: 403 }
      );
    }

    if (event.judging_status === "in_progress") {
      return NextResponse.json({ error: "Judging is already in progress" }, { status: 400 });
    }

    if (event.judging_status === "completed") {
      return NextResponse.json({ error: "Judging has already been completed" }, { status: 400 });
    }

    // Start judging and lock submissions
    const { error: updateError } = await supabase
      .from("events")
      .update({
        judging_status: "in_progress",
        judging_started_at: new Date().toISOString(),
        submissions_locked: true,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error starting judging:", updateError);
      return NextResponse.json({ error: "Failed to start judging" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Judging period started. Submissions are now locked.",
      judging_status: "in_progress",
      judging_started_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error starting judging:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Complete judging period
export async function PATCH(
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

    const access = await verifyAccess(supabase, id, userId);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { event, odUserId } = access;

    // Check plan feature access for judging system
    const planInfo = await getUserPlanInfo(supabase, odUserId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const judgingAccess = checkFeatureAccess(planInfo.planType, "judging_system");
    if (!judgingAccess.allowed) {
      return NextResponse.json(
        {
          error: judgingAccess.reason,
          upgrade_required: judgingAccess.upgrade_required,
        },
        { status: 403 }
      );
    }

    if (event.judging_status !== "in_progress") {
      return NextResponse.json({ error: "Judging is not in progress" }, { status: 400 });
    }

    // Complete judging
    const { error: updateError } = await supabase
      .from("events")
      .update({
        judging_status: "completed",
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error completing judging:", updateError);
      return NextResponse.json({ error: "Failed to complete judging" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Judging period completed.",
      judging_status: "completed",
    });
  } catch (error) {
    console.error("Error completing judging:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
