import { NextResponse } from "next/server";
import { getPortalServiceClient, validatePortalClient, getPortalAuthHeaders } from "@/lib/portal-auth";

// GET - Fetch single project detail for portal client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { portalClientId, sessionToken } = getPortalAuthHeaders(request);
    if (!portalClientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getPortalServiceClient();
    const portalClient = await validatePortalClient(supabase, portalClientId, sessionToken);
    if (!portalClient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch project scoped to this client's tenant and client_id
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, description, status, created_at, due_date, start_date, budget, priority")
      .eq("id", id)
      .eq("client_id", portalClient.client_id)
      .eq("tenant_id", portalClient.tenant_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch tasks for this project
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, status, priority")
      .eq("project_id", id)
      .eq("tenant_id", portalClient.tenant_id)
      .order("created_at", { ascending: true });

    // Calculate progress from tasks
    const allTasks = tasks || [];
    const completedTasks = allTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const progress = allTasks.length > 0
      ? Math.round((completedTasks / allTasks.length) * 100)
      : 0;

    return NextResponse.json({
      ...project,
      tasks: allTasks,
      progress,
    });
  } catch (error) {
    console.error("Portal project detail error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
