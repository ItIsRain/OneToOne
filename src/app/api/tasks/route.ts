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
    query = query
      .order("position", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: tasks, error } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Batch-fetch all assignees and creators in one query instead of N+1
    const userIds = new Set<string>();
    for (const task of tasks || []) {
      if (task.assigned_to) userIds.add(task.assigned_to);
      if (task.created_by) userIds.add(task.created_by);
    }

    const profileMap = new Map<string, { id: string; first_name: string; last_name: string; avatar_url?: string }>();
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", Array.from(userIds));
      for (const p of profiles || []) {
        profileMap.set(p.id, p);
      }
    }

    const tasksWithAssignees = (tasks || []).map((task) => ({
      ...task,
      assignee: task.assigned_to ? profileMap.get(task.assigned_to) ?? null : null,
      creator: task.created_by ? profileMap.get(task.created_by) ?? null : null,
    }));

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

    // Allowlist fields to prevent mass assignment
    const allowedFields = [
      "title", "description", "status", "priority", "assigned_to",
      "project_id", "client_id", "event_id", "parent_task_id",
      "due_date", "start_date", "completed_at", "started_at",
      "estimated_hours", "actual_hours", "position", "tags",
      "category", "notes", "is_recurring", "recurrence_pattern",
      "kanban_column_id", "board_id",
    ];
    const filtered: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) filtered[key] = body[key];
    }

    // Create the task with tenant_id and created_by
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        ...filtered,
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
