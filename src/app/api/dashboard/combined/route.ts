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

// Combined dashboard endpoint - fetches all dashboard data in one request
export async function GET(request: Request) {
  try {
    // Use user ID from middleware header (already validated) to skip getUser() call
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // Get user's tenant_id and profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, first_name, last_name")
      .eq("id", userId)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const tenantId = profile.tenant_id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString();
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Parse query params to check which sections to load
    const url = new URL(request.url);
    const sections = url.searchParams.get("sections")?.split(",") || [
      "settings",
      "metrics",
      "activity",
      "briefing",
      "upcoming",
      "announcements",
      "goals",
      "bookmarks",
    ];

    // Fetch all data in parallel
    const [
      // Dashboard settings
      dashboardSettingsResult,
      // Clients
      clientsResult,
      // Projects
      projectsResult,
      // Tasks
      tasksResult,
      // Invoices
      invoicesResult,
      // Events
      eventsResult,
      // Payments this month
      paymentsThisMonth,
      // Payments last month
      paymentsLastMonth,
      // Activity log
      activityResult,
      // Announcements
      announcementsResult,
      // Goals
      goalsResult,
      // Bookmarks
      bookmarksResult,
      // Team members
      teamMembersResult,
      // Today's appointments
      appointmentsResult,
      // Leads
      leadsResult,
      // Proposals
      proposalsResult,
      // Contracts
      contractsResult,
    ] = await Promise.all([
      // Settings
      sections.includes("settings")
        ? supabase
            .from("tenant_settings")
            .select("settings")
            .eq("tenant_id", tenantId)
            .eq("key", "dashboard_settings")
            .single()
        : Promise.resolve({ data: null }),

      // Active clients
      supabase
        .from("clients")
        .select("id, created_at, name, company, email, status")
        .eq("tenant_id", tenantId)
        .eq("status", "active"),

      // Active projects
      supabase
        .from("projects")
        .select("id, name, status, progress_percentage, end_date")
        .eq("tenant_id", tenantId)
        .in("status", ["in_progress", "on_hold", "planning"]),

      // Tasks
      supabase
        .from("tasks")
        .select("id, title, status, due_date, priority, assigned_to, project_id")
        .eq("tenant_id", tenantId)
        .in("status", ["backlog", "todo", "pending", "in_progress", "in_review", "blocked"]),

      // Invoices
      supabase
        .from("invoices")
        .select("id, title, status, total, amount_paid, currency, due_date")
        .eq("tenant_id", tenantId),

      // Events
      supabase
        .from("events")
        .select("id, title, status, start_date, end_date, location, is_virtual, event_type")
        .eq("tenant_id", tenantId)
        .gte("start_date", todayStr)
        .order("start_date", { ascending: true })
        .limit(20),

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

      // Activity log
      sections.includes("activity")
        ? supabase
            .from("activity_logs")
            .select("id, action, entity_type, entity_id, entity_name, description, created_at")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),

      // Announcements
      sections.includes("announcements")
        ? supabase
            .from("announcements")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("is_published", true)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),

      // Goals
      sections.includes("goals")
        ? supabase
            .from("goals")
            .select("*")
            .eq("tenant_id", tenantId)
            .in("status", ["active", "in_progress"])
            .order("end_date", { ascending: true, nullsFirst: false })
            .limit(5)
        : Promise.resolve({ data: [] }),

      // Bookmarks
      sections.includes("bookmarks")
        ? supabase
            .from("bookmarks")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),

      // Team members
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .eq("tenant_id", tenantId),

      // Today's appointments
      sections.includes("briefing")
        ? supabase
            .from("appointments")
            .select("id, start_time, end_time, client_name, client_email, status, booking_page_id")
            .eq("tenant_id", tenantId)
            .gte("start_time", todayStr)
            .lt("start_time", todayEnd)
            .in("status", ["confirmed", "rescheduled"])
            .order("start_time", { ascending: true })
        : Promise.resolve({ data: [] }),

      // Leads (for briefing)
      sections.includes("briefing")
        ? supabase
            .from("leads")
            .select("id, name, company, status, created_at")
            .eq("tenant_id", tenantId)
            .eq("status", "new")
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),

      // Proposals (for briefing)
      sections.includes("briefing")
        ? supabase
            .from("proposals")
            .select("id, title, status, updated_at")
            .eq("tenant_id", tenantId)
            .in("status", ["sent", "viewed"])
            .order("updated_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),

      // Active contracts count
      supabase
        .from("contracts")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .in("status", ["active", "signed"]),
    ]);

    // Process data
    const clients = clientsResult.data || [];
    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const invoices = invoicesResult.data || [];
    const events = eventsResult.data || [];
    const teamMembers = teamMembersResult.data || [];

    // Revenue calculations
    const revenueThisMonth = (paymentsThisMonth.data || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const revenueLastMonth = (paymentsLastMonth.data || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const revenueGrowth =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : revenueThisMonth > 0
        ? 100
        : 0;

    // Clients added this month
    const clientsThisMonth = clients.filter(
      (c) => c.created_at && new Date(c.created_at) >= new Date(startOfMonth)
    ).length;

    // Task stats
    const overdueTasks = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && !["completed", "cancelled"].includes(t.status)
    );
    const blockedTasks = tasks.filter((t) => t.status === "blocked");
    const pendingTasks = tasks.filter((t) => ["todo", "in_progress", "in_review"].includes(t.status));

    // Events this week
    const eventsThisWeek = events.filter(
      (e) => e.start_date && new Date(e.start_date) <= new Date(weekFromNow)
    );

    // Invoice stats
    const overdueInvoices = invoices.filter((i) => i.status === "overdue");
    const totalOutstanding = invoices
      .filter((i) => ["sent", "viewed", "partially_paid", "overdue"].includes(i.status))
      .reduce((sum, i) => sum + ((i.total || 0) - (i.amount_paid || 0)), 0);

    // Project stats
    const avgProjectProgress =
      projects.length > 0
        ? projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length
        : 0;

    // Build upcoming deadlines
    const upcomingDeadlines = tasks
      .filter((t) => t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) <= new Date(weekFromNow))
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.due_date,
        priority: t.priority || "medium",
        status: t.status,
        path: `/dashboard/projects/tasks?task=${t.id}`,
      }));

    // Build today's schedule
    const todaySchedule = [
      // Events today
      ...events
        .filter((e) => {
          const start = new Date(e.start_date);
          return start >= today && start < new Date(todayEnd);
        })
        .map((e) => ({
          id: e.id,
          type: "event" as const,
          title: e.title,
          time: e.start_date,
          endTime: e.end_date,
          location: e.location,
          eventType: e.event_type,
          isVirtual: e.is_virtual,
          path: `/dashboard/events?event=${e.id}`,
        })),
      // Appointments today
      ...(appointmentsResult.data || []).map((a) => ({
        id: a.id,
        type: "appointment" as const,
        title: a.client_name || "Appointment",
        time: a.start_time,
        endTime: a.end_time,
        location: null,
        attendeeName: a.client_name,
        attendeeEmail: a.client_email,
        path: `/dashboard/booking/appointments?appointment=${a.id}`,
      })),
    ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Build response
    const response = {
      // Dashboard settings
      settings: dashboardSettingsResult.data?.settings || null,

      // User info
      user: {
        firstName: profile.first_name,
        lastName: profile.last_name,
      },

      // Main metrics
      metrics: {
        activeClients: clients.length,
        clientsGrowth: clientsThisMonth,
        upcomingEvents: events.length,
        eventsThisWeek: eventsThisWeek.length,
        monthlyRevenue: revenueThisMonth,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        activeProjects: projects.length,
        avgProjectProgress: Math.round(avgProjectProgress),
        outstandingInvoices: totalOutstanding,
        overdueInvoices: overdueInvoices.length,
        teamMembers: teamMembers.length,
      },

      // Activity feed
      activity: activityResult.data || [],

      // Briefing data
      briefing: {
        firstName: profile.first_name,
        todaySchedule,
        overdueInvoices: {
          count: overdueInvoices.length,
          totalAmount: overdueInvoices.reduce((sum, i) => sum + ((i.total || 0) - (i.amount_paid || 0)), 0),
          items: overdueInvoices.slice(0, 4).map((i) => ({
            id: i.id,
            title: i.title,
            amount: (i.total || 0) - (i.amount_paid || 0),
            dueDate: i.due_date,
            path: `/dashboard/finance/invoices?invoice=${i.id}`,
          })),
        },
        blockedTasks: blockedTasks.slice(0, 3).map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.due_date,
          status: t.status,
          path: `/dashboard/projects/tasks?task=${t.id}`,
        })),
        overdueTasks: overdueTasks.slice(0, 3).map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.due_date,
          status: t.status,
          path: `/dashboard/projects/tasks?task=${t.id}`,
        })),
        pipelineActivity: {
          activeProposals: (proposalsResult.data || []).map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            updatedAt: p.updated_at,
            path: `/dashboard/proposals/${p.id}`,
          })),
          recentLeads: (leadsResult.data || []).map((l) => ({
            id: l.id,
            name: l.name,
            company: l.company,
            status: l.status,
            createdAt: l.created_at,
            path: `/dashboard/crm/leads?lead=${l.id}`,
          })),
        },
        upcomingDeadlines,
        teamSnapshot: {
          totalMembers: teamMembers.length,
          members: teamMembers.slice(0, 8).map((m) => ({
            id: m.id,
            name: [m.first_name, m.last_name].filter(Boolean).join(" ") || "Team Member",
            avatarUrl: m.avatar_url,
            role: m.role,
          })),
        },
      },

      // Upcoming items for DashboardUpcoming
      upcoming: {
        tasks: tasks
          .filter((t) => t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) <= new Date(weekFromNow))
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
          .slice(0, 5),
        events: eventsThisWeek.slice(0, 5).map((e) => ({
          id: e.id,
          title: e.title,
          start_date: e.start_date,
          end_date: e.end_date,
          status: e.status,
          event_type: e.event_type,
        })),
      },

      // Announcements
      announcements: announcementsResult.data || [],

      // Goals
      goals: goalsResult.data || [],

      // Bookmarks
      bookmarks: bookmarksResult.data || [],

      // Team
      team: teamMembers,

      // Timestamp
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Combined dashboard error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
