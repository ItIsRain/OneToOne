import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, updateProjectSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from("projects")
      .select(`
        *,
        client:clients(id, name, company, email, phone),
        primary_contact:contacts(id, first_name, last_name, email, phone, job_title),
        project_manager:profiles!projects_project_manager_id_fkey(id, first_name, last_name, email, avatar_url),
        team_lead:profiles!projects_team_lead_id_fkey(id, first_name, last_name, email, avatar_url),
        lead:leads(id, name, company),
        parent_project:projects!projects_parent_project_id_fkey(id, name, project_code)
      `)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error in project GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateProjectSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Allowlist fields to prevent mass assignment
    const allowedFields = [
      "name", "description", "project_code", "status", "priority",
      "client_id", "primary_contact_id", "project_manager_id", "team_lead_id",
      "start_date", "end_date",
      "color", "tags", "category",
      "billing_type", "hourly_rate", "estimated_hours",
    ];
    const filtered: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) filtered[key] = body[key];
    }
    // Map API field names to actual DB column names
    if ("budget" in body) filtered.budget_amount = body.budget;
    if ("currency" in body) filtered.budget_currency = body.currency;

    // Validate FK references belong to the same tenant
    if (filtered.client_id) {
      const { data: client } = await supabase
        .from("clients").select("id").eq("id", filtered.client_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }
    if (filtered.project_manager_id) {
      const { data: pm } = await supabase
        .from("profiles").select("id").eq("id", filtered.project_manager_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!pm) {
        return NextResponse.json({ error: "Project manager not found in your organization" }, { status: 404 });
      }
    }
    if (filtered.team_lead_id) {
      const { data: tl } = await supabase
        .from("profiles").select("id").eq("id", filtered.team_lead_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!tl) {
        return NextResponse.json({ error: "Team lead not found in your organization" }, { status: 404 });
      }
    }
    if (filtered.primary_contact_id) {
      const { data: contact } = await supabase
        .from("contacts").select("id").eq("id", filtered.primary_contact_id as string).eq("tenant_id", profile.tenant_id).single();
      if (!contact) {
        return NextResponse.json({ error: "Primary contact not found" }, { status: 404 });
      }
    }

    // Fetch old project for status change trigger
    const { data: oldProject } = await supabase
      .from("projects")
      .select("status, tenant_id, name")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    const { data: project, error } = await supabase
      .from("projects")
      .update({
        ...filtered,
        updated_by: userId,
      })
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select(`
        *,
        client:clients(id, name, company),
        primary_contact:contacts(id, first_name, last_name, email),
        project_manager:profiles!projects_project_manager_id_fkey(id, first_name, last_name, avatar_url),
        team_lead:profiles!projects_team_lead_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for project_status_changed
    if (body.status && oldProject && body.status !== oldProject.status && oldProject.tenant_id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("project_status_changed", {
            entity_id: id,
            entity_type: "project",
            entity_name: project.name || oldProject.name,
            project_name: project.name || oldProject.name,
            from_status: oldProject.status,
            to_status: body.status,
          }, serviceClient, oldProject.tenant_id, userId);
        } catch (err) {
          console.error("Workflow trigger error:", err);
        }
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error in project PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check for dependent records before deleting
    const [
      tasksCheck, invoicesCheck, expensesCheck,
      budgetsCheck, timeEntriesCheck, contractsCheck,
      subProjectsCheck,
    ] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("project_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("expenses").select("id", { count: "exact", head: true }).eq("project_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("budgets").select("id", { count: "exact", head: true }).eq("project_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("time_entries").select("id", { count: "exact", head: true }).eq("project_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("contracts").select("id", { count: "exact", head: true }).eq("project_id", id).eq("tenant_id", profile.tenant_id),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("parent_project_id", id).eq("tenant_id", profile.tenant_id),
    ]);

    const deps: string[] = [];
    if (tasksCheck.count && tasksCheck.count > 0) deps.push(`${tasksCheck.count} task(s)`);
    if (invoicesCheck.count && invoicesCheck.count > 0) deps.push(`${invoicesCheck.count} invoice(s)`);
    if (expensesCheck.count && expensesCheck.count > 0) deps.push(`${expensesCheck.count} expense(s)`);
    if (budgetsCheck.count && budgetsCheck.count > 0) deps.push(`${budgetsCheck.count} budget(s)`);
    if (timeEntriesCheck.count && timeEntriesCheck.count > 0) deps.push(`${timeEntriesCheck.count} time entry(ies)`);
    if (contractsCheck.count && contractsCheck.count > 0) deps.push(`${contractsCheck.count} contract(s)`);
    if (subProjectsCheck.count && subProjectsCheck.count > 0) deps.push(`${subProjectsCheck.count} sub-project(s)`);

    if (deps.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete project with existing ${deps.join(", ")}. Please remove or reassign them first.` },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("projects").delete().eq("id", id).eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Error deleting project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in project DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
