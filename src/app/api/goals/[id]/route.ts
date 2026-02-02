import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, updateGoalSchema } from "@/lib/validations";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// GET - Fetch a single goal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { data: goal, error } = await supabase
      .from("goals")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error) {
      console.error("Fetch goal error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Get goal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH - Update a goal
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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
    const validation = validateBody(updateGoalSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_by: user.id,
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.target_type !== undefined) updateData.target_type = body.target_type;
    if (body.target_value !== undefined) updateData.target_value = body.target_value;
    if (body.current_value !== undefined) updateData.current_value = body.current_value;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.auto_track !== undefined) updateData.auto_track = body.auto_track;
    if (body.track_entity !== undefined) updateData.track_entity = body.track_entity;
    if (body.track_filter !== undefined) updateData.track_filter = body.track_filter;
    if (body.period_type !== undefined) updateData.period_type = body.period_type;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.owner_id !== undefined) updateData.owner_id = body.owner_id;
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
    if (body.milestones !== undefined) updateData.milestones = body.milestones;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Handle progress update with history
    if (body.add_update) {
      const { data: current } = await supabase
        .from("goals")
        .select("updates, current_value")
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id)
        .single();

      const updates = current?.updates || [];
      updates.push({
        date: new Date().toISOString(),
        value: body.add_update.value,
        note: body.add_update.note || null,
        updated_by: user.id,
      });

      updateData.updates = updates;
      updateData.current_value = body.add_update.value;
    }

    const { data: goal, error } = await supabase
      .from("goals")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update goal error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE - Delete a goal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { id } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Get goal for activity log
    const { data: goal } = await supabase
      .from("goals")
      .select("title, tenant_id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Delete from database
    const { error } = await supabase.from("goals").delete().eq("id", id).eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete goal error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: goal.tenant_id,
      user_id: user.id,
      action: "deleted",
      entity_type: "goal",
      entity_id: id,
      entity_name: goal.title,
      description: `Deleted goal: ${goal.title}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete goal error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
