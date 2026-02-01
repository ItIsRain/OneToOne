import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Capacity defaults (hours per week)
const CAPACITY: Record<string, number> = {
  "full-time": 40,
  "part-time": 20,
  contractor: 40,
  intern: 20,
  freelancer: 40,
};

function weekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getWeeksBetween(start: string, end: string): { week_start: string; week_end: string }[] {
  const weeks: { week_start: string; week_end: string }[] = [];
  let current = start;
  while (current <= end) {
    weeks.push({ week_start: current, week_end: addDays(current, 6) });
    current = addDays(current, 7);
  }
  return weeks;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const tenantId = profile.tenant_id;

    // Parse query params for date range (default: this week + 7 weeks ahead = 8 weeks)
    const url = new URL(request.url);
    const weeksParam = parseInt(url.searchParams.get("weeks") || "8", 10);
    const numWeeks = Math.min(Math.max(weeksParam, 4), 12);

    const now = new Date();
    const rangeStart = weekStart(now);
    const rangeEnd = addDays(rangeStart, numWeeks * 7 - 1);

    const weeks = getWeeksBetween(rangeStart, rangeEnd);

    // Fetch data in parallel
    const [membersRes, timeEntriesRes, tasksRes] = await Promise.all([
      // Active team members
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, department, job_title, employment_type, hourly_rate, status")
        .eq("tenant_id", tenantId)
        .in("status", ["active", "on_leave"]),

      // Time entries in range
      supabase
        .from("time_entries")
        .select("id, user_id, date, duration_minutes, is_billable, project_id, task_id")
        .eq("tenant_id", tenantId)
        .gte("date", rangeStart)
        .lte("date", rangeEnd),

      // Tasks that overlap the range (have assigned_to, and are not completed/cancelled)
      supabase
        .from("tasks")
        .select("id, title, assigned_to, estimated_hours, start_date, due_date, status, project_id")
        .eq("tenant_id", tenantId)
        .not("assigned_to", "is", null)
        .not("status", "in", '("completed","cancelled")'),
    ]);

    const members = (membersRes.data || []).filter(m => m.status === "active" || m.status === "on_leave");
    const timeEntries = timeEntriesRes.data || [];
    const tasks = tasksRes.data || [];

    // Build lookup: member_id → week_start → time data
    const timeByMemberWeek: Record<string, Record<string, { logged: number; billable: number }>> = {};
    for (const entry of timeEntries) {
      const ws = weekStart(new Date(entry.date));
      if (!timeByMemberWeek[entry.user_id]) timeByMemberWeek[entry.user_id] = {};
      if (!timeByMemberWeek[entry.user_id][ws]) timeByMemberWeek[entry.user_id][ws] = { logged: 0, billable: 0 };
      const hours = (entry.duration_minutes || 0) / 60;
      timeByMemberWeek[entry.user_id][ws].logged += hours;
      if (entry.is_billable) timeByMemberWeek[entry.user_id][ws].billable += hours;
    }

    // Build lookup: member_id → week_start → estimated hours from tasks
    // Distribute task estimated_hours evenly across weeks the task spans
    const estimatedByMemberWeek: Record<string, Record<string, { estimated: number; taskCount: number }>> = {};
    for (const task of tasks) {
      if (!task.assigned_to || !task.estimated_hours) continue;

      const taskStart = task.start_date || task.due_date || rangeStart;
      const taskEnd = task.due_date || task.start_date || rangeEnd;

      // Clamp to our range
      const effectiveStart = taskStart < rangeStart ? rangeStart : taskStart;
      const effectiveEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd;

      // Find weeks this task spans
      const taskWeeks: string[] = [];
      for (const w of weeks) {
        if (w.week_end >= effectiveStart && w.week_start <= effectiveEnd) {
          taskWeeks.push(w.week_start);
        }
      }

      if (taskWeeks.length === 0) continue;

      const hoursPerWeek = task.estimated_hours / taskWeeks.length;
      const memberId = task.assigned_to;

      if (!estimatedByMemberWeek[memberId]) estimatedByMemberWeek[memberId] = {};
      for (const ws of taskWeeks) {
        if (!estimatedByMemberWeek[memberId][ws]) estimatedByMemberWeek[memberId][ws] = { estimated: 0, taskCount: 0 };
        estimatedByMemberWeek[memberId][ws].estimated += hoursPerWeek;
        estimatedByMemberWeek[memberId][ws].taskCount += 1;
      }
    }

    // Build the utilization grid
    const utilization: {
      member_id: string;
      week_start: string;
      hours_logged: number;
      hours_estimated: number;
      hours_capacity: number;
      utilization_percent: number;
      billable_hours: number;
      task_count: number;
    }[] = [];

    for (const member of members) {
      const capacity = CAPACITY[member.employment_type || "full-time"] || 40;

      for (const week of weeks) {
        const ws = week.week_start;
        const time = timeByMemberWeek[member.id]?.[ws];
        const est = estimatedByMemberWeek[member.id]?.[ws];

        const hoursLogged = time?.logged || 0;
        const hoursEstimated = est?.estimated || 0;
        const billableHours = time?.billable || 0;
        const taskCount = est?.taskCount || 0;

        // Use the higher of logged or estimated for utilization calculation
        const effectiveHours = Math.max(hoursLogged, hoursEstimated);
        const utilizationPercent = capacity > 0 ? Math.round((effectiveHours / capacity) * 100) : 0;

        utilization.push({
          member_id: member.id,
          week_start: ws,
          hours_logged: Math.round(hoursLogged * 10) / 10,
          hours_estimated: Math.round(hoursEstimated * 10) / 10,
          hours_capacity: capacity,
          utilization_percent: utilizationPercent,
          billable_hours: Math.round(billableHours * 10) / 10,
          task_count: taskCount,
        });
      }
    }

    // Compute summary stats
    const memberUtilizations = members.map((m) => {
      const cells = utilization.filter((u) => u.member_id === m.id);
      const avg = cells.length > 0 ? Math.round(cells.reduce((s, c) => s + c.utilization_percent, 0) / cells.length) : 0;
      return { id: m.id, avg };
    });

    const totalMembers = members.length;
    const avgUtilization = totalMembers > 0
      ? Math.round(memberUtilizations.reduce((s, m) => s + m.avg, 0) / totalMembers)
      : 0;
    const overallocated = memberUtilizations.filter((m) => m.avg > 100).length;
    const underutilized = memberUtilizations.filter((m) => m.avg < 50).length;
    const optimal = memberUtilizations.filter((m) => m.avg >= 70 && m.avg <= 100).length;

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: [m.first_name, m.last_name].filter(Boolean).join(" ") || "Unknown",
        avatar_url: m.avatar_url,
        department: m.department,
        job_title: m.job_title,
        employment_type: m.employment_type || "full-time",
        capacity_hours: CAPACITY[m.employment_type || "full-time"] || 40,
        status: m.status,
        avg_utilization: memberUtilizations.find((mu) => mu.id === m.id)?.avg || 0,
      })),
      weeks,
      utilization,
      stats: {
        total_members: totalMembers,
        avg_utilization: avgUtilization,
        overallocated_count: overallocated,
        underutilized_count: underutilized,
        optimal_count: optimal,
      },
    });
  } catch (error) {
    console.error("Resource utilization error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
