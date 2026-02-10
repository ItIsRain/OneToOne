import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBody, createActivityLogSchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

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

// GET - Fetch activity logs
export async function GET(request: Request) {
  try {
    // Use user ID from middleware header (already validated) to skip getUser() call
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const entityType = searchParams.get("entity_type");

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    const { data: activities, count, error } = await query;

    if (error) {
      console.error("Fetch activity error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      activities: activities || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Get activity error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST - Create activity log
export async function POST(request: Request) {
  try {
    // Use user ID from middleware header (already validated) to skip getUser() call
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createActivityLogSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const activityData = {
      tenant_id: profile.tenant_id,
      user_id: userId,
      action: body.action,
      entity_type: body.entity_type,
      entity_id: body.entity_id || null,
      entity_name: body.entity_name || null,
      description: body.description || null,
      metadata: body.metadata || {},
    };

    const { data: activity, error } = await supabase
      .from("activity_logs")
      .insert(activityData)
      .select()
      .single();

    if (error) {
      console.error("Insert activity error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("Create activity error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
