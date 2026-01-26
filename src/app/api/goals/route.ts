import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// GET - Fetch goals
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const period = searchParams.get("period");

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

    // Build query
    let query = supabase
      .from("goals")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (period) {
      query = query.eq("period_type", period);
    }

    const { data: goals, error } = await query;

    if (error) {
      console.error("Fetch goals error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-update goals that track entities
    const autoTrackGoals = (goals || []).filter((g) => g.auto_track && g.track_entity);
    for (const goal of autoTrackGoals) {
      const currentValue = await calculateGoalProgress(supabase, profile.tenant_id, goal);
      if (currentValue !== goal.current_value) {
        await supabase
          .from("goals")
          .update({ current_value: currentValue })
          .eq("id", goal.id);
        goal.current_value = currentValue;
      }
    }

    return NextResponse.json({ goals: goals || [] });
  } catch (error) {
    console.error("Get goals error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Helper to calculate auto-tracked goal progress
async function calculateGoalProgress(
  supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
  tenantId: string,
  goal: { track_entity: string; start_date?: string; end_date?: string; track_filter?: Record<string, unknown> }
): Promise<number> {
  const { track_entity, start_date, end_date } = goal;

  try {
    switch (track_entity) {
      case "revenue": {
        let query = supabase
          .from("payments")
          .select("amount")
          .eq("tenant_id", tenantId)
          .eq("status", "completed");

        if (start_date) query = query.gte("payment_date", start_date);
        if (end_date) query = query.lte("payment_date", end_date);

        const { data } = await query;
        return (data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      }

      case "clients": {
        let query = supabase
          .from("clients")
          .select("id", { count: "exact" })
          .eq("tenant_id", tenantId);

        if (start_date) query = query.gte("created_at", start_date);
        if (end_date) query = query.lte("created_at", end_date);

        const { count } = await query;
        return count || 0;
      }

      case "projects": {
        let query = supabase
          .from("projects")
          .select("id", { count: "exact" })
          .eq("tenant_id", tenantId)
          .eq("status", "completed");

        if (start_date) query = query.gte("created_at", start_date);
        if (end_date) query = query.lte("created_at", end_date);

        const { count } = await query;
        return count || 0;
      }

      case "tasks": {
        let query = supabase
          .from("tasks")
          .select("id", { count: "exact" })
          .eq("tenant_id", tenantId)
          .eq("status", "completed");

        if (start_date) query = query.gte("created_at", start_date);
        if (end_date) query = query.lte("created_at", end_date);

        const { count } = await query;
        return count || 0;
      }

      case "invoices": {
        let query = supabase
          .from("invoices")
          .select("total")
          .eq("tenant_id", tenantId)
          .eq("status", "paid");

        if (start_date) query = query.gte("created_at", start_date);
        if (end_date) query = query.lte("created_at", end_date);

        const { data } = await query;
        return (data || []).reduce((sum, i) => sum + (i.total || 0), 0);
      }

      case "events": {
        let query = supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("tenant_id", tenantId)
          .eq("status", "completed");

        if (start_date) query = query.gte("start_date", start_date);
        if (end_date) query = query.lte("start_date", end_date);

        const { count } = await query;
        return count || 0;
      }

      default:
        return 0;
    }
  } catch {
    return 0;
  }
}

// POST - Create goal
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();

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

    if (!body.title || !body.target_type) {
      return NextResponse.json(
        { error: "Title and target_type are required" },
        { status: 400 }
      );
    }

    const goalData = {
      tenant_id: profile.tenant_id,
      title: body.title,
      description: body.description || null,
      target_type: body.target_type,
      target_value: body.target_value || null,
      current_value: body.current_value || 0,
      unit: body.unit || null,
      auto_track: body.auto_track || false,
      track_entity: body.track_entity || null,
      track_filter: body.track_filter || {},
      period_type: body.period_type || "monthly",
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      status: body.status || "active",
      category: body.category || null,
      color: body.color || "#3B82F6",
      icon: body.icon || null,
      owner_id: body.owner_id || user.id,
      assigned_to: body.assigned_to || [],
      milestones: body.milestones || [],
      notes: body.notes || null,
      created_by: user.id,
      updated_by: user.id,
    };

    const { data: goal, error } = await supabase
      .from("goals")
      .insert(goalData)
      .select()
      .single();

    if (error) {
      console.error("Insert goal error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: "created",
      entity_type: "goal",
      entity_id: goal.id,
      entity_name: goal.title,
      description: `Created goal: ${goal.title}`,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("Create goal error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
