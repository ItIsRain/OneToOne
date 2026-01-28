import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkTriggers } from "@/lib/workflows/triggers";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Fetch projects with related data
    const { data: projects, error } = await supabase
      .from("projects")
      .select(`
        *,
        client:clients(id, name, company),
        primary_contact:contacts(id, first_name, last_name, email),
        project_manager:profiles!projects_project_manager_id_fkey(id, first_name, last_name, avatar_url),
        team_lead:profiles!projects_team_lead_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error in projects GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Create the project with tenant_id and created_by
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        ...body,
        tenant_id: profile.tenant_id,
        created_by: user.id,
      })
      .select(`
        *,
        client:clients(id, name, company),
        primary_contact:contacts(id, first_name, last_name, email),
        project_manager:profiles!projects_project_manager_id_fkey(id, first_name, last_name, avatar_url),
        team_lead:profiles!projects_team_lead_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger workflow automations for project_created
    checkTriggers("project_created", { entity_id: project.id, entity_type: "project", project_name: project.name }, supabase, profile.tenant_id, user.id).catch(() => {});

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error in projects POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
