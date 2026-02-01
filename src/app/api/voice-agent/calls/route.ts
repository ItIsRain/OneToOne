import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/voice-agent/calls
 * List all voice agent calls for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const workflowRunId = searchParams.get("workflow_run_id");

    // Build query
    let query = supabase
      .from("voice_agent_calls")
      .select(
        `
        id,
        call_sid,
        from_number,
        to_number,
        status,
        ai_provider,
        ai_model,
        duration_seconds,
        goal_achieved,
        recording_url,
        total_cost_usd,
        created_at,
        started_at,
        ended_at,
        workflow_run_id,
        step_execution_id
      `,
        { count: "exact" }
      )
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (workflowRunId) {
      query = query.eq("workflow_run_id", workflowRunId);
    }

    const { data: calls, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch calls: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      calls,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching voice calls:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
