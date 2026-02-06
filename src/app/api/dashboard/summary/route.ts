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

    // Get profile with tenant_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id, first_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tenantId = profile.tenant_id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // Run all queries in parallel
    const [
      overdueTasksResult,
      todayEventsResult,
      unpaidInvoicesResult,
      unreadMessagesResult,
    ] = await Promise.all([
      // Overdue tasks: due_date < today AND status not completed/cancelled
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .lt("due_date", startOfDay)
        .not("status", "in", '("completed","cancelled")'),

      // Events happening today
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("start_date", startOfDay)
        .lt("start_date", endOfDay),

      // Unpaid invoices (status is not 'paid')
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "sent"),

      // Unread messages count - messages table doesn't have tenant_id or is_read
      // TODO: Implement proper unread tracking via conversation_participants
      Promise.resolve({ count: 0 }),
    ]);

    return NextResponse.json({
      firstName: profile.first_name || "",
      overdueTasks: overdueTasksResult.count ?? 0,
      todayEvents: todayEventsResult.count ?? 0,
      unpaidInvoices: unpaidInvoicesResult.count ?? 0,
      unreadMessages: unreadMessagesResult.count ?? 0,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
