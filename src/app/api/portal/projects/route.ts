import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function validatePortalClient(supabase: ReturnType<typeof getServiceClient>, portalClientId: string) {
  const { data, error } = await supabase
    .from("portal_clients")
    .select("id, client_id, tenant_id, name, email, is_active")
    .eq("id", portalClientId)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

// GET - Fetch portal client's projects
export async function GET(request: Request) {
  try {
    const portalClientId = request.headers.get("x-portal-client-id");
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId);
    if (!portalClient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch projects for this client
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, description, status, created_at, due_date, start_date, budget, priority")
      .eq("client_id", portalClient.client_id)
      .eq("tenant_id", portalClient.tenant_id)
      .order("created_at", { ascending: false });

    if (projectsError) {
      console.error("Fetch projects error:", projectsError);
      return NextResponse.json({ error: projectsError.message }, { status: 500 });
    }

    // Fetch task counts per project
    const projectIds = (projects || []).map((p) => p.id);
    let taskCounts: Record<string, number> = {};

    if (projectIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("project_id")
        .in("project_id", projectIds);

      if (!tasksError && tasks) {
        taskCounts = tasks.reduce((acc: Record<string, number>, task) => {
          acc[task.project_id] = (acc[task.project_id] || 0) + 1;
          return acc;
        }, {});
      }
    }

    const projectsWithCounts = (projects || []).map((project) => ({
      ...project,
      tasks_count: taskCounts[project.id] || 0,
    }));

    return NextResponse.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error("Portal projects error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
