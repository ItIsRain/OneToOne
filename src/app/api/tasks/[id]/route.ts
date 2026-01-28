import { createClient } from "@/lib/supabase/server";
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

    const { data: task, error } = await supabase
      .from("tasks")
      .select(`
        *,
        project:project_id(id, name, project_code, color, client_id),
        client:client_id(id, name, company, email),
        event:event_id(id, title),
        parent_task:parent_task_id(id, title, task_number, status)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching task:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch assignee and creator info
    let assignee = null;
    let creator = null;

    if (task.assigned_to) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
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

    return NextResponse.json({ ...task, assignee, creator });
  } catch (error) {
    console.error("Error in task GET:", error);
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

    // Fetch old task for status change trigger
    const { data: oldTask } = await supabase.from("tasks").select("status, tenant_id").eq("id", id).single();

    // Auto-set timestamps based on status changes
    const updates = { ...body };
    if (body.status === "in_progress" && !body.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (body.status === "completed" && !body.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        project:project_id(id, name, project_code, color),
        client:client_id(id, name, company)
      `)
      .single();

    if (error) {
      console.error("Error updating task:", error);
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

    // Trigger workflow automations for task_status_changed
    if (body.status && oldTask && body.status !== oldTask.status && oldTask.tenant_id) {
      checkTriggers("task_status_changed", { entity_id: id, entity_type: "task", from_status: oldTask.status, to_status: body.status }, supabase, oldTask.tenant_id, user.id).catch(() => {});
    }

    return NextResponse.json({ ...task, assignee, creator });
  } catch (error) {
    console.error("Error in task PATCH:", error);
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

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in task DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
