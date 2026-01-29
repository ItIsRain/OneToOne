import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { checkTriggers } from "@/lib/workflows/triggers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assigned_to");

    // Build query - use simpler joins
    let query = supabase
      .from("tasks")
      .select(`
        *,
        project:project_id(id, name, project_code, color),
        client:client_id(id, name, company),
        event:event_id(id, title)
      `)
      .eq("tenant_id", profile.tenant_id);

    // Apply filters
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }

    // Order by position then created_at
    query = query.order("position", { ascending: true }).order("created_at", { ascending: false });

    const { data: tasks, error } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch assignee info separately for tasks that have assigned_to
    const tasksWithAssignees = await Promise.all(
      (tasks || []).map(async (task) => {
        let assignee = null;
        let creator = null;

        if (task.assigned_to) {
          const { data } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .eq("id", task.assigned_to)
            .single();
          assignee = data;
        }

        if (task.created_by) {
          const { data } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .eq("id", task.created_by)
            .single();
          creator = data;
        }

        return { ...task, assignee, creator };
      })
    );

    return NextResponse.json(tasksWithAssignees);
  } catch (error) {
    console.error("Error in tasks GET:", error);
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

    // Create the task with tenant_id and created_by
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        ...body,
        tenant_id: profile.tenant_id,
        created_by: user.id,
      })
      .select(`
        *,
        project:project_id(id, name, project_code, color),
        client:client_id(id, name, company)
      `)
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch assignee and creator info
    let assignee = null;
    let creator = null;

    if (task.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .eq("id", task.assigned_to)
        .single();
      assignee = data;
    }

    if (task.created_by) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", task.created_by)
        .single();
      creator = data;
    }

    // Trigger workflow automations for task_created
    if (profile?.tenant_id) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
        try {
          await checkTriggers("task_created", {
            entity_id: task.id,
            entity_type: "task",
            entity_name: task.title,
            task_title: task.title,
            task_status: task.status,
            task_priority: task.priority,
            task_assignee_id: task.assigned_to,
            task_project_id: task.project_id,
          }, serviceClient, profile.tenant_id, user.id);
        } catch (err) {
          console.error("Workflow trigger error (task_created):", err);
        }
      }
    }

    return NextResponse.json({ ...task, assignee, creator }, { status: 201 });
  } catch (error) {
    console.error("Error in tasks POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
