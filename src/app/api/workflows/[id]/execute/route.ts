import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflows/engine";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    const tenantId = profile.tenant_id;

    // Rate limit: 10 workflow executions per user per minute per workflow
    // This prevents resource exhaustion while allowing legitimate testing
    const rateCheck = await checkRateLimit({
      key: `workflow-execute-${id}`,
      identifier: user.id,
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds!);
    }

    const { data: workflow, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error || !workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Parse trigger_data from request body if provided
    let triggerData: Record<string, unknown> = {};
    try {
      const body = await request.json();
      triggerData = body.trigger_data ?? {};
    } catch {
      // No body or invalid JSON is fine for manual runs
    }

    const runId = await executeWorkflow(
      id,
      triggerData,
      supabase,
      user.id,
      tenantId
    );

    return NextResponse.json({ run_id: runId });
  } catch (error) {
    console.error("POST /api/workflows/[id]/execute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
