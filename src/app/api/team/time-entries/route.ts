import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanInfo, checkFeatureAccess } from "@/lib/plan-limits";
import { validateBody, createTimeEntrySchema } from "@/lib/validations";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch all time entries for the user's tenant
export async function GET(request: Request) {
  try {
    const currentUserId = getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const userId = searchParams.get("user_id");
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", currentUserId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for time tracking
    const planInfo = await getUserPlanInfo(supabase, currentUserId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const timeTrackingAccess = checkFeatureAccess(planInfo.planType, "time_tracking");
    if (!timeTrackingAccess.allowed) {
      return NextResponse.json(
        {
          error: timeTrackingAccess.reason,
          upgrade_required: timeTrackingAccess.upgrade_required,
        },
        { status: 403 }
      );
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
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's profile with tenant_id, hourly_rate, and role
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("tenant_id, hourly_rate, role")
      .eq("id", userId)
      .single();

    if (!currentProfile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Check plan feature access for time tracking
    const planInfo = await getUserPlanInfo(supabase, userId);
    if (!planInfo) {
      return NextResponse.json(
        { error: "No active subscription found", upgrade_required: true },
        { status: 403 }
      );
    }

    const timeTrackingAccess = checkFeatureAccess(planInfo.planType, "time_tracking");
    if (!timeTrackingAccess.allowed) {
      return NextResponse.json(
        {
          error: timeTrackingAccess.reason,
          upgrade_required: timeTrackingAccess.upgrade_required,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(createTimeEntrySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Calculate duration if start and end time provided
    let durationMinutes = body.duration_minutes || 0;
    if (body.start_time && body.end_time && !body.duration_minutes) {
      const [startH, startM] = body.start_time.split(":").map(Number);
      const [endH, endM] = body.end_time.split(":").map(Number);
      let rawDuration = (endH * 60 + endM) - (startH * 60 + startM);
      if (rawDuration < 0) rawDuration += 24 * 60; // Handle overnight

      const breakMins = body.break_minutes || 0;

      // Validate break_minutes doesn't exceed total work time
      if (breakMins > rawDuration) {
        return NextResponse.json(
          { error: `Break time (${breakMins} min) cannot exceed total time (${rawDuration} min)` },
          { status: 400 }
        );
      }

      durationMinutes = rawDuration - breakMins;
    }

    // Also validate break_minutes when duration is provided directly
    if (body.duration_minutes && body.break_minutes) {
      if (body.break_minutes > body.duration_minutes) {
        return NextResponse.json(
          { error: `Break time (${body.break_minutes} min) cannot exceed duration (${body.duration_minutes} min)` },
          { status: 400 }
        );
      }
    }

    // Validate user_id belongs to same tenant (if explicitly provided)
    // Only owners and admins can create time entries for other users
    if (body.user_id && body.user_id !== userId) {
      // Check if current user has permission to log time for others
      const allowedRoles = ["owner", "admin"];
      if (!currentProfile.role || !allowedRoles.includes(currentProfile.role)) {
        return NextResponse.json(
          { error: "You don't have permission to log time for other users" },
          { status: 403 }
        );
      }

      const { data: targetUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", body.user_id)
        .eq("tenant_id", currentProfile.tenant_id)
        .single();

      if (!targetUser) {
        return NextResponse.json({ error: "User not found in your organization" }, { status: 400 });
      }
    }

    // Validate project_id belongs to same tenant
    if (body.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", body.project_id)
        .eq("tenant_id", currentProfile.tenant_id)
        .single();

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 400 });
      }
    }

    // Validate task_id belongs to same tenant
    if (body.task_id) {
      const { data: task } = await supabase
        .from("tasks")
        .select("id")
        .eq("id", body.task_id)
        .eq("tenant_id", currentProfile.tenant_id)
        .single();

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 400 });
      }
    }

    // Check for overlapping time entries if start/end times are provided
    if (body.start_time && body.end_time && body.date) {
      const entryUserId = body.user_id || userId;

      // Fetch existing time entries for this user on this date
      const { data: existingEntries } = await supabase
        .from("time_entries")
        .select("id, start_time, end_time")
        .eq("user_id", entryUserId)
        .eq("date", body.date)
        .eq("tenant_id", currentProfile.tenant_id)
        .not("start_time", "is", null)
        .not("end_time", "is", null);

      if (existingEntries && existingEntries.length > 0) {
        const newStart = body.start_time;
        const newEnd = body.end_time;

        // Convert times to minutes for easier comparison
        const toMinutes = (time: string) => {
          const [h, m] = time.split(":").map(Number);
          return h * 60 + m;
        };

        const newStartMins = toMinutes(newStart);
        let newEndMins = toMinutes(newEnd);
        // Handle overnight entries
        if (newEndMins <= newStartMins) newEndMins += 24 * 60;

        for (const entry of existingEntries) {
          const existingStartMins = toMinutes(entry.start_time);
          let existingEndMins = toMinutes(entry.end_time);
          if (existingEndMins <= existingStartMins) existingEndMins += 24 * 60;

          // Check for overlap: start1 < end2 AND end1 > start2
          const overlaps = newStartMins < existingEndMins && newEndMins > existingStartMins;
          if (overlaps) {
            return NextResponse.json(
              { error: `Time entry overlaps with existing entry (${entry.start_time}-${entry.end_time})` },
              { status: 409 }
            );
          }
        }
      }
    }

    // Calculate hourly rate
    const hourlyRate = body.hourly_rate ?? currentProfile.hourly_rate ?? 0;
    const isBillable = body.is_billable ?? true;

    // Warn if billable entry has zero rate (unless force is set)
    if (!body.force && isBillable && hourlyRate === 0 && durationMinutes > 0) {
      return NextResponse.json(
        {
          error: "Billable time entry has zero hourly rate",
          code: "ZERO_RATE_WARNING",
          message: "This billable time entry has no hourly rate set. Set \"is_billable: false\" to log non-billable time, set an hourly rate, or add \"force: true\" to create anyway.",
          duration_minutes: durationMinutes,
          calculated_value: 0,
        },
        { status: 409 }
      );
    }

    const timeEntryData = {
      tenant_id: currentProfile.tenant_id,
      user_id: body.user_id || userId,
      project_id: body.project_id || null,
      task_id: body.task_id || null,
      date: body.date,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      duration_minutes: durationMinutes,
      description: body.description || null,
      is_billable: isBillable,
      hourly_rate: hourlyRate,
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
