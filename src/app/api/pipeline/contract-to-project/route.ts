import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { extractScopeItems, extractMilestones } from "@/lib/pipeline/utils";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Feature gate
    const planInfo = await getUserPlanInfo(supabase, user.id);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }
    const access = checkFeatureAccess(planInfo.planType, "sow_pipeline");
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, upgrade_required: true },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contract_id } = body;

    if (!contract_id) {
      return NextResponse.json(
        { error: "contract_id is required" },
        { status: 400 }
      );
    }

    // Fetch contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contract_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Contract must be signed or active
    if (!["active", "pending_signature"].includes(contract.status) && !contract.is_signed) {
      return NextResponse.json(
        { error: "Contract must be signed or active to create a project" },
        { status: 400 }
      );
    }

    // Duplicate check: contract already linked to a project
    if (contract.project_id) {
      return NextResponse.json(
        {
          error: "A project already exists for this contract",
          project_id: contract.project_id,
        },
        { status: 409 }
      );
    }

    // Create project
    const projectData = {
      tenant_id: profile.tenant_id,
      name: contract.name,
      client_id: contract.client_id,
      budget: contract.value || 0,
      currency: contract.currency || "USD",
      start_date: contract.start_date || new Date().toISOString().split("T")[0],
      end_date: contract.end_date || null,
      status: "planning",
      description: `Generated from contract: ${contract.name}`,
      tags: ["pipeline:auto-generated"],
      created_by: user.id,
    };

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert(projectData)
      .select("*")
      .single();

    if (projectError) {
      console.error("Pipeline project creation error:", projectError);
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      );
    }

    // Link contract to project
    await supabase
      .from("contracts")
      .update({ project_id: project.id })
      .eq("id", contract.id);

    // Extract scope items and create tasks
    const sections = Array.isArray(contract.sections) ? contract.sections : [];
    const scopeItems = extractScopeItems(sections);
    const createdTasks: unknown[] = [];

    if (scopeItems.length > 0) {
      const taskInserts = scopeItems.map((item, index) => ({
        tenant_id: profile.tenant_id,
        project_id: project.id,
        title: item.title,
        status: "todo",
        priority: "medium",
        category: item.category,
        sort_order: index,
        tags: ["pipeline:scope"],
        created_by: user.id,
      }));

      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .insert(taskInserts)
        .select("*");

      if (tasksError) {
        console.error("Pipeline tasks creation error:", tasksError);
      } else if (tasks) {
        createdTasks.push(...tasks);
      }
    }

    // Extract milestones and create milestone tasks
    const milestones = extractMilestones(sections);
    const createdMilestones: unknown[] = [];

    if (milestones.length > 0) {
      const milestoneInserts = milestones.map((ms, index) => ({
        tenant_id: profile.tenant_id,
        project_id: project.id,
        title: `Milestone: ${ms.name}`,
        status: "todo",
        priority: "high",
        category: "milestone",
        sort_order: scopeItems.length + index,
        tags: ["pipeline:milestone", "pipeline:payment"],
        notes: ms.amount
          ? `[milestone_amount:${ms.amount}] ${ms.description || ""}`
          : ms.description || "",
        due_date: ms.date || null,
        created_by: user.id,
      }));

      const { data: msTasks, error: msError } = await supabase
        .from("tasks")
        .insert(milestoneInserts)
        .select("*");

      if (msError) {
        console.error("Pipeline milestone tasks creation error:", msError);
      } else if (msTasks) {
        createdMilestones.push(...msTasks);
      }
    }

    return NextResponse.json({
      project,
      tasks: createdTasks,
      milestones: createdMilestones,
    });
  } catch (error) {
    console.error("Pipeline contract-to-project error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
