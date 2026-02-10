import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { executeWorkflow } from "@/lib/workflows/engine";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createClient();
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
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
      .eq("requested_from", userId)
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
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createClient();
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    if (!profile?.tenant_id) return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    const tenantId = profile.tenant_id;

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

    // Security: Enforce tenant isolation to prevent cross-tenant approval manipulation
    const { data: approval, error: approvalError } = await supabase
      .from("workflow_approvals")
      .update(updateData)
      .eq("id", approval_id)
      .eq("requested_from", userId)
      .eq("tenant_id", tenantId)
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

      // If approved, resume the workflow by re-executing from the next step
      if (status === "approved" && stepExecution.run_id) {
        await supabase
          .from("workflow_runs")
          .update({ status: "running" })
          .eq("id", stepExecution.run_id);

        // Fetch the workflow run to get workflow_id, trigger_data, tenant_id
        const { data: workflowRun } = await supabase
          .from("workflow_runs")
          .select("workflow_id, trigger_data, tenant_id, triggered_by")
          .eq("id", stepExecution.run_id)
          .single();

        if (workflowRun) {
          // Re-execute the workflow - it will skip already-completed steps
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (supabaseUrl && supabaseServiceKey) {
            const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
            try {
              await executeWorkflow(
                workflowRun.workflow_id,
                (workflowRun.trigger_data as Record<string, unknown>) || {},
                serviceClient,
                workflowRun.triggered_by || userId,
                workflowRun.tenant_id
              );
            } catch (err) {
              console.error("Failed to resume workflow after approval:", err);
            }
          }
        }
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
