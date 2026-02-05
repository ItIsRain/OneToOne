import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(
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

    const { data: workflow, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error || !workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const { data: steps, error: stepsError } = await supabase
      .from("workflow_steps")
      .select("*")
      .eq("workflow_id", id)
      .order("step_order", { ascending: true });

    if (stepsError) {
      return NextResponse.json({ error: stepsError.message }, { status: 500 });
    }

    return NextResponse.json({ workflow: { ...workflow, steps } });
  } catch (error) {
    console.error("GET /api/workflows/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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

    const { data: existing } = await supabase
      .from("workflows")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const body = await request.json();
    const { steps, graph_layout, ...rawFields } = body;

    // Whitelist allowed fields to prevent overwriting tenant_id, created_by, etc.
    const allowedFields = ["name", "description", "trigger_type", "trigger_config", "status", "is_template", "template_category", "canvas_data"];
    const workflowFields: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (rawFields[key] !== undefined) {
        workflowFields[key] = rawFields[key];
      }
    }

    // Persist graph_layout alongside other workflow fields
    if (graph_layout !== undefined) {
      workflowFields.graph_layout = graph_layout;
    }

    const { data: workflow, error: updateError } = await supabase
      .from("workflows")
      .update(workflowFields)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (steps && Array.isArray(steps)) {
      // Use service role client to bypass RLS for cascade deletion.
      // The RLS policies don't include DELETE on step_executions/approvals/runs,
      // so the user client silently fails to delete those records.
      const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Clean up all dependent records before deleting steps.
      // FK chain: approvals → step_executions → steps, and step_executions → runs

      const { data: runs } = await adminClient
        .from("workflow_runs")
        .select("id")
        .eq("workflow_id", id);

      if (runs && runs.length > 0) {
        const runIds = runs.map((r: { id: string }) => r.id);

        // Get all step execution IDs via run_id
        const { data: allExecs } = await adminClient
          .from("workflow_step_executions")
          .select("id")
          .in("run_id", runIds);

        if (allExecs && allExecs.length > 0) {
          const execIds = allExecs.map((e: { id: string }) => e.id);

          // 1. Delete approvals referencing these executions
          await adminClient
            .from("workflow_approvals")
            .delete()
            .in("step_execution_id", execIds);

          // 2. Delete step executions
          await adminClient
            .from("workflow_step_executions")
            .delete()
            .in("run_id", runIds);
        }

        // 3. Delete runs
        await adminClient
          .from("workflow_runs")
          .delete()
          .eq("workflow_id", id);
      }

      // 4. Also delete any orphaned step_executions by step_id (belt-and-suspenders)
      const { data: existingSteps } = await adminClient
        .from("workflow_steps")
        .select("id")
        .eq("workflow_id", id);

      if (existingSteps && existingSteps.length > 0) {
        const stepIds = existingSteps.map((s: { id: string }) => s.id);

        const { data: orphanExecs } = await adminClient
          .from("workflow_step_executions")
          .select("id")
          .in("step_id", stepIds);

        if (orphanExecs && orphanExecs.length > 0) {
          const orphanExecIds = orphanExecs.map((e: { id: string }) => e.id);
          await adminClient.from("workflow_approvals").delete().in("step_execution_id", orphanExecIds);
          await adminClient.from("workflow_step_executions").delete().in("step_id", stepIds);
        }
      }

      // 5. Now safe to delete the steps
      const { error: deleteError } = await adminClient
        .from("workflow_steps")
        .delete()
        .eq("workflow_id", id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      if (steps.length > 0) {
        const stepRows = steps.map((step: { step_order: number; step_type: string; config: Record<string, unknown> }) => ({
          workflow_id: id,
          step_order: step.step_order,
          step_type: step.step_type,
          config: step.config,
        }));

        const { error: insertError } = await supabase
          .from("workflow_steps")
          .insert(stepRows);

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("PATCH /api/workflows/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Verify ownership
    const { data: existing } = await supabase
      .from("workflows")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Use service role client to cascade-delete all dependent records
    // FK chain: approvals → step_executions → steps, and step_executions → runs → workflow
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Get all runs for this workflow
    const { data: runs } = await adminClient
      .from("workflow_runs")
      .select("id")
      .eq("workflow_id", id);

    if (runs && runs.length > 0) {
      const runIds = runs.map((r: { id: string }) => r.id);

      // Get all step executions via run_id
      const { data: allExecs } = await adminClient
        .from("workflow_step_executions")
        .select("id")
        .in("run_id", runIds);

      if (allExecs && allExecs.length > 0) {
        const execIds = allExecs.map((e: { id: string }) => e.id);
        await adminClient.from("workflow_approvals").delete().in("step_execution_id", execIds);
        await adminClient.from("workflow_step_executions").delete().in("run_id", runIds);
      }

      await adminClient.from("workflow_runs").delete().eq("workflow_id", id);
    }

    // 2. Clean up steps (and any orphaned executions)
    const { data: existingSteps } = await adminClient
      .from("workflow_steps")
      .select("id")
      .eq("workflow_id", id);

    if (existingSteps && existingSteps.length > 0) {
      const stepIds = existingSteps.map((s: { id: string }) => s.id);

      const { data: orphanExecs } = await adminClient
        .from("workflow_step_executions")
        .select("id")
        .in("step_id", stepIds);

      if (orphanExecs && orphanExecs.length > 0) {
        const orphanExecIds = orphanExecs.map((e: { id: string }) => e.id);
        await adminClient.from("workflow_approvals").delete().in("step_execution_id", orphanExecIds);
        await adminClient.from("workflow_step_executions").delete().in("step_id", stepIds);
      }

      await adminClient.from("workflow_steps").delete().eq("workflow_id", id);
    }

    // 3. Now safe to delete the workflow itself
    const { error } = await adminClient
      .from("workflows")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workflows/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
