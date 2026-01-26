import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper to get tenant and verify access
async function verifyAccess(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
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

  return { user, profile, event };
}

// GET - Get judging status and judges for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const access = await verifyAccess(supabase, id);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { event } = access;

    // Get judges
    const { data: judges } = await supabase
      .from("event_judges")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    // Get submission count
    const { count: submissionCount } = await supabase
      .from("event_submissions")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id)
      .eq("status", "submitted");

    // Get scores count
    const submissionIds = (await supabase
      .from("event_submissions")
      .select("id")
      .eq("event_id", id)
    ).data?.map(s => s.id) || [];

    let scoresCount = 0;
    if (submissionIds.length > 0) {
      const { count } = await supabase
        .from("submission_scores")
        .select("*", { count: "exact", head: true })
        .in("submission_id", submissionIds);
      scoresCount = count || 0;
    }

    return NextResponse.json({
      judging_status: event.judging_status || "not_started",
      judging_started_at: event.judging_started_at,
      submissions_locked: event.submissions_locked || false,
      judging_criteria: event.requirements?.judging_criteria || [],
      judges: judges || [],
      stats: {
        total_submissions: submissionCount || 0,
        total_judges: judges?.length || 0,
        total_scores: scoresCount,
        active_judges: judges?.filter(j => j.status === "active").length || 0,
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
    const { id } = await params;
    const supabase = await createClient();

    const access = await verifyAccess(supabase, id);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { event } = access;

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
    const { id } = await params;
    const supabase = await createClient();

    const access = await verifyAccess(supabase, id);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { event } = access;

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
