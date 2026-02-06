import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { validateBody, createWorkflowSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    const tenantId = profile.tenant_id;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    let query = supabase
      .from("workflows")
      .select("*, workflow_steps(id)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: workflows, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map workflow_steps join to a `steps` array so the frontend can read .steps.length
    const mapped = (workflows || []).map((w: Record<string, unknown>) => {
      const { workflow_steps, ...rest } = w;
      return { ...rest, steps: Array.isArray(workflow_steps) ? workflow_steps : [] };
    });

    return NextResponse.json({ workflows: mapped });
  } catch (error) {
    console.error("GET /api/workflows error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    const tenantId = profile.tenant_id;

    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }
    const access = checkFeatureAccess(planInfo.planType, "workflows");
    if (!access.allowed) return NextResponse.json({ error: access.reason, upgrade_required: true }, { status: 403 });

    const body = await request.json();

    // Validate input with enum validation for trigger_type and step_type
    const validation = validateBody(createWorkflowSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const v = validation.data;

    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .insert({
        tenant_id: tenantId,
        created_by: user.id,
        name: v.name,
        description: v.description || null,
        trigger_type: v.trigger_type,
        trigger_config: v.trigger_config,
      })
      .select()
      .single();

    if (workflowError) {
      return NextResponse.json({ error: workflowError.message }, { status: 500 });
    }

    if (v.steps && v.steps.length > 0) {
      const stepRows = v.steps.map((step) => ({
        workflow_id: workflow.id,
        step_order: step.step_order,
        step_type: step.step_type,
        config: step.config,
      }));

      const { error: stepsError } = await supabase
        .from("workflow_steps")
        .insert(stepRows);

      if (stepsError) {
        return NextResponse.json({ error: stepsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error("POST /api/workflows error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
