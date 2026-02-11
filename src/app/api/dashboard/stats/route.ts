import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

// GET - Fetch all dashboard stats
export async function GET(request: Request) {
  try {
    // Use user ID from middleware header (already validated) to skip getUser() call
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

    // Fetch all stats in parallel
    const [
      clientsResult,
      projectsResult,
      tasksResult,
      invoicesResult,
      eventsResult,
      paymentsThisMonth,
      paymentsLastMonth,
      upcomingTasks,
      upcomingEvents,
      recentFiles,
      teamMembers,
    ] = await Promise.all([
      // Active clients count
      supabase
        .from("clients")
        .select("id, created_at", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("status", "active"),

      // Active projects
      supabase
        .from("projects")
        .select("id, status, progress_percentage", { count: "exact" })
        .eq("tenant_id", tenantId)
        .in("status", ["in_progress", "on_hold"]),

      // Pending tasks
      supabase
        .from("tasks")
        .select("id, status, due_date, priority", { count: "exact" })
        .eq("tenant_id", tenantId)
        .in("status", ["todo", "in_progress", "review"]),

      // Invoices
      supabase
        .from("invoices")
        .select("id, status, total, amount_paid, currency")
        .eq("tenant_id", tenantId),

      // Upcoming events
      supabase
        .from("events")
        .select("id, status, start_date", { count: "exact" })
        .eq("tenant_id", tenantId)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true }),

      // Payments this month
      supabase
        .from("payments")
        .select("amount, currency")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("payment_date", startOfMonth),

      // Payments last month
      supabase
        .from("payments")
        .select("amount, currency")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("payment_date", startOfLastMonth)
        .lt("payment_date", endOfLastMonth),

      // Tasks due this week
      supabase
        .from("tasks")
        .select("id, title, due_date, priority, status, project_id")
        .eq("tenant_id", tenantId)
        .gte("due_date", new Date().toISOString().split("T")[0])
        .lte("due_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .in("status", ["todo", "in_progress"])
        .order("due_date", { ascending: true })
        .limit(5),

      // Events this week
      supabase
        .from("events")
        .select("id, name, start_date, end_date, status, event_type")
        .eq("tenant_id", tenantId)
        .gte("start_date", new Date().toISOString())
        .lte("start_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("start_date", { ascending: true })
        .limit(5),

      // Recent files
      supabase
        .from("files")
        .select("id, name, file_type, file_size, created_at, thumbnail_url")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5),

      // Team members
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .eq("tenant_id", tenantId),
    ]);

    // Calculate metrics
    const clients = clientsResult.data || [];
    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const invoices = invoicesResult.data || [];
    const events = eventsResult.data || [];

    // Revenue calculations
    const revenueThisMonth = (paymentsThisMonth.data || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const revenueLastMonth = (paymentsLastMonth.data || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const revenueGrowth = revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : revenueThisMonth > 0 ? 100 : 0;

    // Clients added this month
    const clientsThisMonth = clients.filter(
      (c) => c.created_at && new Date(c.created_at) >= new Date(startOfMonth)
    ).length;

    // Overdue tasks
    const overdueTasks = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed"
    ).length;

    // Events this week
    const eventsThisWeek = events.filter(
      (e) => e.start_date && new Date(e.start_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Invoice stats
    const totalOutstanding = invoices
      .filter((i) => ["sent", "viewed", "partially_paid", "overdue"].includes(i.status))
      .reduce((sum, i) => sum + ((i.total || 0) - (i.amount_paid || 0)), 0);

    const overdueInvoices = invoices.filter((i) => i.status === "overdue").length;

    // Project stats
    const avgProjectProgress = projects.length > 0
      ? projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length
      : 0;

    const stats = {
      // Main metrics
      metrics: {
        activeClients: clients.length,
        clientsGrowth: clientsThisMonth,
        upcomingEvents: events.length,
        eventsThisWeek,
        monthlyRevenue: revenueThisMonth,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        pendingTasks: tasks.length,
        overdueTasks,
        activeProjects: projects.length,
        avgProjectProgress: Math.round(avgProjectProgress),
        outstandingInvoices: totalOutstanding,
        overdueInvoices,
        teamMembers: (teamMembers.data || []).length,
      },

      // Upcoming items
      upcoming: {
        tasks: upcomingTasks.data || [],
        events: upcomingEvents.data || [],
      },

      // Recent files
      recentFiles: recentFiles.data || [],

      // Team
      team: teamMembers.data || [],

      // Quick stats for charts
      chartData: {
        tasksByStatus: {
          todo: tasks.filter((t) => t.status === "todo").length,
          inProgress: tasks.filter((t) => t.status === "in_progress").length,
          review: tasks.filter((t) => t.status === "review").length,
        },
        tasksByPriority: {
          high: tasks.filter((t) => t.priority === "high" || t.priority === "urgent").length,
          medium: tasks.filter((t) => t.priority === "medium").length,
          low: tasks.filter((t) => t.priority === "low").length,
        },
        projectsByStatus: {
          active: projects.filter((p) => p.status === "in_progress").length,
          onHold: projects.filter((p) => p.status === "on_hold").length,
        },
        invoicesByStatus: {
          draft: invoices.filter((i) => i.status === "draft").length,
          sent: invoices.filter((i) => i.status === "sent" || i.status === "viewed").length,
          paid: invoices.filter((i) => i.status === "paid").length,
          overdue: invoices.filter((i) => i.status === "overdue").length,
        },
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
