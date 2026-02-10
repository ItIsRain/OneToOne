import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createKanbanBoardSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    let query = supabase
      .from("kanban_boards")
      .select(`
        *,
        project:projects(id, name, project_code, color),
        creator:profiles!kanban_boards_created_by_fkey(id, first_name, last_name)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching kanban boards:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/kanban-boards:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createKanbanBoardSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const allowedFields = ["name", "description", "project_id", "columns", "settings"];
    const insertData: Record<string, unknown> = {
      tenant_id: profile.tenant_id,
      created_by: userId,
    };
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        insertData[key] = body[key];
      }
    }

    const { data, error } = await supabase
      .from("kanban_boards")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating kanban board:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/kanban-boards:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
