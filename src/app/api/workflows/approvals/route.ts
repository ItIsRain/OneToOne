import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    const tenantId = profile.tenant_id;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "pending";

    const { data: approvals, error } = await supabase
      .from("workflow_approvals")
      .select(`
        *,
        step_execution:step_execution_id(
          id,
          run_id,
          step_id,
          workflow_run:run_id(
            id,
            workflow_id,
            workflow:workflow_id(name)
          )
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("requested_from", user.id)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("GET /api/workflows/approvals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
    if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant found" }, { status: 400 });

    const body = await request.json();
    const { approval_id, status, comment } = body;

    if (!approval_id || !status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid approval_id or status" }, { status: 400 });
    }

    // Update the approval record
    const updateData: Record<string, unknown> = {
      status,
      decided_at: new Date().toISOString(),
    };
    if (comment) {
      updateData.comment = comment;
    }

    const { data: approval, error: approvalError } = await supabase
      .from("workflow_approvals")
      .update(updateData)
      .eq("id", approval_id)
      .eq("requested_from", user.id)
      .select("*, step_execution:step_execution_id(id, run_id)")
      .single();

    if (approvalError || !approval) {
      return NextResponse.json({ error: "Approval not found or update failed" }, { status: 404 });
    }

    // Update the step execution status
    const stepExecution = approval.step_execution as { id: string; run_id: string } | null;
    if (stepExecution?.id) {
      await supabase
        .from("workflow_step_executions")
        .update({
          status: status === "approved" ? "completed" : "failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", stepExecution.id);

      // If approved, resume the workflow run
      if (status === "approved" && stepExecution.run_id) {
        await supabase
          .from("workflow_runs")
          .update({ status: "running" })
          .eq("id", stepExecution.run_id);
      }

      // If rejected, fail the workflow run
      if (status === "rejected" && stepExecution.run_id) {
        await supabase
          .from("workflow_runs")
          .update({ status: "failed", completed_at: new Date().toISOString() })
          .eq("id", stepExecution.run_id);
      }
    }

    return NextResponse.json({ approval });
  } catch (error) {
    console.error("PATCH /api/workflows/approvals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
