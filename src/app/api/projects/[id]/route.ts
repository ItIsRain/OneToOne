import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkTriggers } from "@/lib/workflows/triggers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Fetch old project for status change trigger
    const { data: oldProject } = await supabase
      .from("projects")
      .select("status, tenant_id, name")
      .eq("id", id)
      .single();

    const { data: project, error } = await supabase
      .from("projects")
      .update({
        ...body,
        updated_by: user.id,
      })
      .eq("id", id)
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
          }, serviceClient, oldProject.tenant_id, user.id);
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
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("projects").delete().eq("id", id);

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
