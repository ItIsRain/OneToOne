import { NextResponse } from "next/server";
import { getPortalServiceClient, validatePortalClient, getPortalAuthHeaders } from "@/lib/portal-auth";

// GET - Fetch portal client's projects
export async function GET(request: Request) {
  try {
    const { portalClientId, sessionToken } = getPortalAuthHeaders(request);
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getPortalServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId, sessionToken);
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
    let completedTaskCounts: Record<string, number> = {};

    if (projectIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("project_id, status")
        .in("project_id", projectIds);

      if (!tasksError && tasks) {
        taskCounts = tasks.reduce((acc: Record<string, number>, task) => {
          acc[task.project_id] = (acc[task.project_id] || 0) + 1;
          return acc;
        }, {});
        completedTaskCounts = tasks
          .filter((t) => t.status === "completed")
          .reduce((acc: Record<string, number>, task) => {
            acc[task.project_id] = (acc[task.project_id] || 0) + 1;
            return acc;
          }, {});
      }
    }

    const projectsWithCounts = (projects || []).map((project) => {
      const total = taskCounts[project.id] || 0;
      const completed = completedTaskCounts[project.id] || 0;
      return {
        ...project,
        tasks_count: total,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    return NextResponse.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error("Portal projects error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
