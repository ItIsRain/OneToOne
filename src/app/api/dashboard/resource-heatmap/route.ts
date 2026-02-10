import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSunday(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatWeekLabel(monday: Date): string {
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function GET(request: Request) {
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

    const tenantId = profile.tenant_id;

    // Calculate 4 weeks: current week + next 3
    const now = new Date();
    const currentMonday = getMonday(now);
    const weeks: { start: Date; end: Date; label: string }[] = [];

    for (let i = 0; i < 4; i++) {
      const monday = new Date(currentMonday);
      monday.setDate(monday.getDate() + i * 7);
      const sunday = getSunday(monday);
      weeks.push({
        start: monday,
        end: sunday,
        label: formatWeekLabel(monday),
      });
    }

    const rangeStart = formatDateISO(weeks[0].start);
    const rangeEnd = formatDateISO(weeks[3].end);

    // Fetch team members and tasks in parallel
    const [membersResult, tasksResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .eq("tenant_id", tenantId),
      supabase
        .from("tasks")
        .select("id, title, priority, assigned_to, due_date")
        .eq("tenant_id", tenantId)
        .gte("due_date", rangeStart)
        .lte("due_date", rangeEnd)
        .not("assigned_to", "is", null),
    ]);

    const members = membersResult.data || [];
    const tasks = tasksResult.data || [];

    // Build member utilization data
    const memberData = members.map((member) => {
      const memberTasks = tasks.filter((t) => t.assigned_to === member.id);

      const weekData = weeks.map((week) => {
        const weekStart = formatDateISO(week.start);
        const weekEnd = formatDateISO(week.end);

        const weekTasks = memberTasks.filter((t) => {
          const due = t.due_date;
          return due >= weekStart && due <= weekEnd;
        });

        const taskCount = weekTasks.length;
        const utilization = Math.min(Math.round((taskCount / 5) * 100), 100);

        return {
          taskCount,
          utilization,
          tasks: weekTasks.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
          })),
        };
      });

      const totalUtilization = weekData.reduce((sum, w) => sum + w.utilization, 0);
      const averageUtilization = Math.round(totalUtilization / weekData.length);

      return {
        id: member.id,
        name: [member.first_name, member.last_name].filter(Boolean).join(" ") || "Unknown",
        avatar: member.avatar_url || null,
        role: member.role || "member",
        weeks: weekData,
        averageUtilization,
      };
    });

    // Calculate summary
    const weekAverages = weeks.map((_, weekIndex) => {
      if (memberData.length === 0) return 0;
      const total = memberData.reduce((sum, m) => sum + m.weeks[weekIndex].utilization, 0);
      return Math.round(total / memberData.length);
    });

    const overbooked = memberData.filter((m) => m.averageUtilization > 90).length;
    const available = memberData.filter((m) => m.averageUtilization <= 40).length;

    return NextResponse.json({
      weeks: weeks.map((w) => w.label),
      weekRanges: weeks.map((w) => ({
        start: formatDateISO(w.start),
        end: formatDateISO(w.end),
      })),
      members: memberData,
      summary: {
        weekAverages,
        overbooked,
        available,
      },
    });
  } catch (error) {
    console.error("Resource heatmap error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
