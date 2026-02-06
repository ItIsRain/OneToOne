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

// GET - Fetch command center analytics
export async function GET() {
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

    const tenantId = profile.tenant_id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    // Build last 6 months date ranges
    const monthRanges: { label: string; start: string; end: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = mStart.toLocaleString("en-US", { month: "short" });
      monthRanges.push({
        label,
        start: mStart.toISOString(),
        end: mEnd.toISOString(),
      });
    }

    // Fetch all data in parallel
    const [
      clientsResult,
      leadsResult,
      projectsResult,
      allTasksResult,
      invoicesResult,
      paymentsThisMonth,
      teamResult,
      todayEventsResult,
      todayTasksResult,
      ...monthlyPayments
    ] = await Promise.all([
      // All clients with status
      supabase
        .from("clients")
        .select("id, status, created_at")
        .eq("tenant_id", tenantId),

      // All leads with status
      supabase
        .from("leads")
        .select("id, status, created_at")
        .eq("tenant_id", tenantId),

      // All projects with progress
      supabase
        .from("projects")
        .select("id, status, progress_percentage, name")
        .eq("tenant_id", tenantId),

      // All tasks
      supabase
        .from("tasks")
        .select("id, status, due_date, priority, assigned_to, title, project_id")
        .eq("tenant_id", tenantId),

      // All invoices
      supabase
        .from("invoices")
        .select("id, status, total, amount_paid, currency")
        .eq("tenant_id", tenantId),

      // Payments this month
      supabase
        .from("payments")
        .select("amount, currency")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("payment_date", startOfMonth),

      // Team profiles
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .eq("tenant_id", tenantId),

      // Today's events
      supabase
        .from("events")
        .select("id, title, start_date, end_date, event_type, status")
        .eq("tenant_id", tenantId)
        .gte("start_date", todayStart)
        .lt("start_date", todayEnd)
        .order("start_date", { ascending: true }),

      // Today's tasks (due today)
      supabase
        .from("tasks")
        .select("id, title, due_date, priority, status, assigned_to")
        .eq("tenant_id", tenantId)
        .gte("due_date", todayStart.split("T")[0])
        .lte("due_date", todayEnd.split("T")[0])
        .order("priority", { ascending: true }),

      // Last 6 months revenue (one query per month)
      ...monthRanges.map((range) =>
        supabase
          .from("payments")
          .select("amount")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("payment_date", range.start)
          .lt("payment_date", range.end)
      ),
    ]);

    const clients = clientsResult.data || [];
    const leads = leadsResult.data || [];
    const projects = projectsResult.data || [];
    const allTasks = allTasksResult.data || [];
    const invoices = invoicesResult.data || [];
    const team = teamResult.data || [];
    const todayEvents = todayEventsResult.data || [];
    const todayTasks = todayTasksResult.data || [];

    // Revenue this month
    const revenueThisMonth = (paymentsThisMonth.data || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // Revenue chart (last 6 months)
    const revenueChart = monthRanges.map((range, i) => ({
      month: range.label,
      revenue: (monthlyPayments[i]?.data || []).reduce(
        (sum: number, p: { amount: number }) => sum + (p.amount || 0),
        0
      ),
    }));

    // Active clients
    const activeClients = clients.filter((c) => c.status === "active").length;

    // Pipeline funnel
    const pipeline = {
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      proposal: leads.filter((l) => l.status === "proposal").length,
      won: leads.filter((l) => l.status === "won" || l.status === "converted").length,
    };

    // Project status distribution
    const projectStatus = {
      active: projects.filter((p) => p.status === "in_progress").length,
      completed: projects.filter((p) => p.status === "completed").length,
      onHold: projects.filter((p) => p.status === "on_hold").length,
      planning: projects.filter((p) => p.status === "planning" || p.status === "draft").length,
    };

    // Task stats
    const pendingTasks = allTasks.filter(
      (t) => t.status === "todo" || t.status === "in_progress" || t.status === "review"
    ).length;
    const overdueTasks = allTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && !["completed", "cancelled"].includes(t.status)
    ).length;

    // Team utilization: tasks per member
    const teamUtilization = team.map((member) => {
      const memberTasks = allTasks.filter((t) => t.assigned_to === member.id);
      const activeTasks = memberTasks.filter(
        (t) => t.status === "in_progress" || t.status === "review"
      ).length;
      const totalAssigned = memberTasks.filter(
        (t) => !["completed", "cancelled"].includes(t.status)
      ).length;
      // Assume max capacity of 10 tasks per person
      const utilization = Math.min(Math.round((totalAssigned / 10) * 100), 100);
      return {
        id: member.id,
        name: [member.first_name, member.last_name].filter(Boolean).join(" ") || "Team Member",
        avatar: member.avatar_url,
        role: member.role,
        activeTasks,
        totalAssigned,
        utilization,
      };
    });

    // Invoice summary
    const invoiceSummary = {
      total: invoices.length,
      paid: invoices.filter((i) => i.status === "paid").length,
      pending: invoices.filter((i) =>
        ["sent", "viewed", "partially_paid"].includes(i.status)
      ).length,
      overdue: invoices.filter((i) => i.status === "overdue").length,
      totalOutstanding: invoices
        .filter((i) => ["sent", "viewed", "partially_paid", "overdue"].includes(i.status))
        .reduce((sum, i) => sum + ((i.total || 0) - (i.amount_paid || 0)), 0),
    };

    // Today's deadlines (tasks + events)
    const todayDeadlines = [
      ...todayTasks.map((t) => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        time: t.due_date,
        priority: t.priority,
        status: t.status,
      })),
      ...todayEvents.map((e) => ({
        id: e.id,
        type: "event" as const,
        title: e.title,
        time: e.start_date,
        priority: null,
        status: e.status,
      })),
    ];

    const data = {
      revenue: {
        thisMonth: revenueThisMonth,
        chart: revenueChart,
      },
      clients: {
        active: activeClients,
        total: clients.length,
      },
      pipeline,
      projects: {
        total: projects.length,
        status: projectStatus,
      },
      tasks: {
        pending: pendingTasks,
        overdue: overdueTasks,
        total: allTasks.length,
      },
      invoices: invoiceSummary,
      teamUtilization,
      todayDeadlines,
      teamCount: team.length,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Command center error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
