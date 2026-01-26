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

// GET - Fetch all time entries for the user's tenant
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const userId = searchParams.get("user_id");
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

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
      .from("time_entries")
      .select(`
        *,
        project:projects(id, name, project_code),
        task:tasks(id, title),
        user:profiles!time_entries_user_id_fkey(id, first_name, last_name, email, avatar_url, job_title, hourly_rate),
        approver:profiles!time_entries_approved_by_fkey(id, first_name, last_name)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: timeEntries, error } = await query;

    if (error) {
      console.error("Fetch time entries error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const stats = {
      today: timeEntries
        ?.filter((e) => e.date === today)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0,
      thisWeek: timeEntries
        ?.filter((e) => e.date >= weekStartStr)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0,
      thisMonth: timeEntries
        ?.filter((e) => e.date >= monthStartStr)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0,
      billable: timeEntries
        ?.filter((e) => e.is_billable && e.date >= monthStartStr)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0,
      pending: timeEntries?.filter((e) => e.status === "submitted").length || 0,
    };

    return NextResponse.json({ timeEntries, stats });
  } catch (error) {
    console.error("Get time entries error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST - Create a new time entry
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

    // Get user's profile with tenant_id and hourly_rate
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, hourly_rate")
      .eq("id", user.id)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();

    // Calculate duration if start and end time provided
    let durationMinutes = body.duration_minutes || 0;
    if (body.start_time && body.end_time && !body.duration_minutes) {
      const [startH, startM] = body.start_time.split(":").map(Number);
      const [endH, endM] = body.end_time.split(":").map(Number);
      durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight
      durationMinutes -= body.break_minutes || 0;
    }

    const timeEntryData = {
      tenant_id: currentProfile.tenant_id,
      user_id: body.user_id || user.id,
      project_id: body.project_id || null,
      task_id: body.task_id || null,
      date: body.date,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      duration_minutes: durationMinutes,
      description: body.description || null,
      is_billable: body.is_billable ?? true,
      hourly_rate: body.hourly_rate ?? currentProfile.hourly_rate ?? 0,
      status: body.status || "draft",
      break_minutes: body.break_minutes || 0,
      work_type: body.work_type || "regular",
      location: body.location || null,
      notes: body.notes || null,
      tags: body.tags || [],
    };

    const { data: timeEntry, error } = await supabase
      .from("time_entries")
      .insert(timeEntryData)
      .select(`
        *,
        project:projects(id, name, project_code),
        task:tasks(id, title),
        user:profiles!time_entries_user_id_fkey(id, first_name, last_name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ timeEntry }, { status: 201 });
  } catch (error) {
    console.error("Create time entry error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
