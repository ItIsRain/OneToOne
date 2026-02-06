import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, first_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tenantId = profile.tenant_id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

    const [
      todayEventsResult,
      todayAppointmentsResult,
      overdueInvoicesResult,
      blockedTasksResult,
      overdueTasks,
      proposalsViewedResult,
      leadsRecentResult,
      upcomingDeadlinesResult,
      teamMembersResult,
    ] = await Promise.all([
      // Today's events
      supabase
        .from("events")
        .select("id, title, start_date, end_date, location, event_type, is_virtual")
        .eq("tenant_id", tenantId)
        .gte("start_date", startOfDay)
        .lt("start_date", endOfDay)
        .order("start_date", { ascending: true })
        .limit(10),

      // Today's appointments
      supabase
        .from("appointments")
        .select("id, start_time, end_time, status, client_name, client_email")
        .eq("tenant_id", tenantId)
        .gte("start_time", startOfDay)
        .lt("start_time", endOfDay)
        .not("status", "eq", "cancelled")
        .order("start_time", { ascending: true })
        .limit(10),

      // Overdue invoices with total amount
      supabase
        .from("invoices")
        .select("id, title, invoice_number, total, due_date, status, client_id")
        .eq("tenant_id", tenantId)
        .eq("status", "overdue")
        .order("due_date", { ascending: true })
        .limit(10),

      // Blocked tasks (status = blocked or has blockers)
      supabase
        .from("tasks")
        .select("id, title, status, priority, assigned_to, project_id")
        .eq("tenant_id", tenantId)
        .eq("status", "blocked")
        .order("priority", { ascending: true })
        .limit(10),

      // Overdue tasks
      supabase
        .from("tasks")
        .select("id, title, due_date, priority, status, assigned_to")
        .eq("tenant_id", tenantId)
        .lt("due_date", startOfDay)
        .not("status", "in", '("completed","done")')
        .order("due_date", { ascending: true })
        .limit(10),

      // Recently viewed proposals (updated in last 7 days with status sent)
      supabase
        .from("proposals")
        .select("id, title, status, updated_at, client_id")
        .eq("tenant_id", tenantId)
        .eq("status", "sent")
        .gte("updated_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("updated_at", { ascending: false })
        .limit(5),

      // New leads in last 7 days
      supabase
        .from("leads")
        .select("id, name, company, status, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(5),

      // Tasks with deadlines in next 7 days
      supabase
        .from("tasks")
        .select("id, title, due_date, priority, status")
        .eq("tenant_id", tenantId)
        .gte("due_date", startOfDay)
        .lt("due_date", endOfWeek)
        .not("status", "in", '("completed","done")')
        .order("due_date", { ascending: true })
        .limit(8),

      // Team members (for availability snapshot)
      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .eq("tenant_id", tenantId)
        .limit(20),
    ]);

    // Calculate overdue invoice total
    const overdueInvoiceTotal = (overdueInvoicesResult.data || []).reduce(
      (sum, inv) => sum + (Number(inv.total) || 0),
      0
    );

    return NextResponse.json({
      firstName: profile.first_name || "",
      todaySchedule: [
        ...(todayEventsResult.data || []).map((e) => ({
          id: e.id,
          type: "event" as const,
          title: e.title,
          time: e.start_date,
          endTime: e.end_date,
          location: e.location,
          eventType: e.event_type,
          isVirtual: e.is_virtual,
          path: `/dashboard/events/${e.id}`,
        })),
        ...(todayAppointmentsResult.data || []).map((a) => ({
          id: a.id,
          type: "appointment" as const,
          title: a.client_name ? `Meeting with ${a.client_name}` : "Appointment",
          time: a.start_time,
          endTime: a.end_time,
          attendeeName: a.client_name,
          attendeeEmail: a.client_email,
          path: `/dashboard/booking/appointments`,
        })),
      ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),

      overdueInvoices: {
        count: (overdueInvoicesResult.data || []).length,
        totalAmount: overdueInvoiceTotal,
        items: (overdueInvoicesResult.data || []).map((inv) => ({
          id: inv.id,
          title: inv.title || inv.invoice_number,
          amount: Number(inv.total) || 0,
          dueDate: inv.due_date,
          path: `/dashboard/finance/invoices/${inv.id}`,
        })),
      },

      blockedTasks: (blockedTasksResult.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        path: `/dashboard/projects/tasks/${t.id}`,
      })),

      overdueTasks: (overdueTasks.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.due_date,
        priority: t.priority,
        path: `/dashboard/projects/tasks/${t.id}`,
      })),

      pipelineActivity: {
        activeProposals: (proposalsViewedResult.data || []).map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          updatedAt: p.updated_at,
          path: `/dashboard/proposals/${p.id}`,
        })),
        recentLeads: (leadsRecentResult.data || []).map((l) => ({
          id: l.id,
          name: l.name,
          company: l.company,
          status: l.status,
          createdAt: l.created_at,
          path: `/dashboard/crm/leads/${l.id}`,
        })),
      },

      upcomingDeadlines: (upcomingDeadlinesResult.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.due_date,
        priority: t.priority,
        status: t.status,
        path: `/dashboard/projects/tasks/${t.id}`,
      })),

      teamSnapshot: {
        totalMembers: (teamMembersResult.data || []).length,
        members: (teamMembersResult.data || []).slice(0, 8).map((m) => ({
          id: m.id,
          name: [m.first_name, m.last_name].filter(Boolean).join(" ") || "Team Member",
          avatarUrl: m.avatar_url,
          role: m.role,
        })),
      },
    });
  } catch (error) {
    console.error("Briefing error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
