import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkTriggers } from "@/lib/workflows/triggers";
import { validateBody, createProjectSchema } from "@/lib/validations";

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

    // Validate input
    const validation = validateBody(createProjectSchema, body);
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

    // Create the project with tenant_id and created_by
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        ...filtered,
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      try {
        await checkTriggers("project_created", {
          entity_id: project.id,
          entity_type: "project",
          entity_name: project.name,
          project_name: project.name,
          project_status: project.status,
          project_client_id: project.client_id,
        }, serviceClient, profile.tenant_id, user.id);
      } catch (err) {
        console.error("Workflow trigger error:", err);
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error in projects POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
