import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // First verify the user is a platform admin
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: adminRecord } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service role client for cross-tenant queries
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Date calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Fetch all stats in parallel
    const [
      // Core counts
      totalTenantsResult,
      activeTenantsResult,
      totalUsersResult,
      totalProjectsResult,
      totalTasksResult,
      completedTasksResult,
      totalClientsResult,
      activeClientsResult,
      totalInvoicesResult,
      paidInvoicesResult,

      // This month vs last month
      newTenantsThisMonthResult,
      newTenantsLastMonthResult,
      newUsersThisMonthResult,
      newUsersLastMonthResult,

      // Recent data
      recentTenantsResult,
      recentUsersResult,

      // Subscriptions & revenue
      subscriptionsResult,
      invoiceAmountsResult,

      // Chart data
      tenantsByMonth,
      usersByMonth,
      tenantsByPlan,

      // Top tenants
      topTenantsByUsers,
      topTenantsByProjects,

      // Activity this week
      newProjectsThisWeek,
      newTasksThisWeek,
      newInvoicesThisWeek,
    ] = await Promise.all([
      // Core counts
      serviceClient.from("tenants").select("*", { count: "exact", head: true }),
      serviceClient.from("tenants").select("*", { count: "exact", head: true }).eq("status", "active"),
      serviceClient.from("profiles").select("*", { count: "exact", head: true }),
      serviceClient.from("projects").select("*", { count: "exact", head: true }),
      serviceClient.from("tasks").select("*", { count: "exact", head: true }),
      serviceClient.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed"),
      serviceClient.from("clients").select("*", { count: "exact", head: true }),
      serviceClient.from("clients").select("*", { count: "exact", head: true }).eq("status", "active"),
      serviceClient.from("invoices").select("*", { count: "exact", head: true }),
      serviceClient.from("invoices").select("*", { count: "exact", head: true }).eq("status", "paid"),

      // This month vs last month
      serviceClient.from("tenants").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
      serviceClient.from("tenants").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth.toISOString()).lte("created_at", endOfLastMonth.toISOString()),
      serviceClient.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
      serviceClient.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth.toISOString()).lte("created_at", endOfLastMonth.toISOString()),

      // Recent data
      serviceClient.from("tenants").select("id, name, subdomain, created_at, status, plan").order("created_at", { ascending: false }).limit(5),
      serviceClient.from("profiles").select("id, email, first_name, last_name, created_at, tenant_id, tenants:tenant_id(name)").order("created_at", { ascending: false }).limit(5),

      // Subscriptions & revenue
      serviceClient.from("tenant_subscriptions").select("plan_type, status, monthly_price").eq("status", "active"),
      serviceClient.from("invoices").select("total, status"),

      // Chart data
      serviceClient.from("tenants").select("created_at").gte("created_at", sixMonthsAgo.toISOString()).order("created_at", { ascending: true }),
      serviceClient.from("profiles").select("created_at").gte("created_at", sixMonthsAgo.toISOString()).order("created_at", { ascending: true }),
      serviceClient.from("tenants").select("plan"),

      // Top tenants by activity
      serviceClient.from("tenants").select("id, name, subdomain, plan").limit(100),
      serviceClient.from("tenants").select("id, name, subdomain, plan").limit(100),

      // Activity this week
      serviceClient.from("projects").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
      serviceClient.from("tasks").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
      serviceClient.from("invoices").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
    ]);

    // Get user and project counts per tenant for top tenants
    const tenantIds = (topTenantsByUsers.data || []).map(t => t.id);
    const [userCountsByTenant, projectCountsByTenant] = await Promise.all([
      serviceClient.from("profiles").select("tenant_id").in("tenant_id", tenantIds),
      serviceClient.from("projects").select("tenant_id").in("tenant_id", tenantIds),
    ]);

    // Count users per tenant
    const userCounts: Record<string, number> = {};
    (userCountsByTenant.data || []).forEach(u => {
      userCounts[u.tenant_id] = (userCounts[u.tenant_id] || 0) + 1;
    });

    // Count projects per tenant
    const projectCounts: Record<string, number> = {};
    (projectCountsByTenant.data || []).forEach(p => {
      projectCounts[p.tenant_id] = (projectCounts[p.tenant_id] || 0) + 1;
    });

    // Build top tenants list
    const topTenants = (topTenantsByUsers.data || [])
      .map(t => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        plan: t.plan || "free",
        users: userCounts[t.id] || 0,
        projects: projectCounts[t.id] || 0,
      }))
      .sort((a, b) => (b.users + b.projects) - (a.users + a.projects))
      .slice(0, 5);

    // Calculate MRR
    const mrr = (subscriptionsResult.data || []).reduce((sum, sub) => sum + (sub.monthly_price || 0), 0);

    // Calculate invoice totals
    const invoiceData = invoiceAmountsResult.data || [];
    const totalInvoiced = invoiceData.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = invoiceData.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Process monthly growth data for charts
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(monthNames[d.getMonth()]);
    }

    // Count tenants by month
    const tenantGrowth = last6Months.map((month, idx) => {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - (5 - idx));
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      return (tenantsByMonth.data || []).filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      }).length;
    });

    // Count users by month
    const userGrowth = last6Months.map((month, idx) => {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - (5 - idx));
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      return (usersByMonth.data || []).filter(u => {
        const d = new Date(u.created_at);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      }).length;
    });

    // Count tenants by plan for pie chart
    const planCounts: Record<string, number> = { free: 0, starter: 0, professional: 0, business: 0 };
    (tenantsByPlan.data || []).forEach(t => {
      const plan = (t.plan || "free").toLowerCase();
      if (plan in planCounts) {
        planCounts[plan as keyof typeof planCounts]++;
      } else {
        planCounts.free++;
      }
    });

    // Calculate growth percentages
    const tenantsThisMonth = newTenantsThisMonthResult.count || 0;
    const tenantsLastMonth = newTenantsLastMonthResult.count || 0;
    const tenantGrowthPercent = tenantsLastMonth > 0
      ? Math.round(((tenantsThisMonth - tenantsLastMonth) / tenantsLastMonth) * 100)
      : tenantsThisMonth > 0 ? 100 : 0;

    const usersThisMonth = newUsersThisMonthResult.count || 0;
    const usersLastMonth = newUsersLastMonthResult.count || 0;
    const userGrowthPercent = usersLastMonth > 0
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0;

    // Calculate averages
    const totalTenants = totalTenantsResult.count || 1;
    const avgUsersPerTenant = Math.round(((totalUsersResult.count || 0) / totalTenants) * 10) / 10;
    const avgProjectsPerTenant = Math.round(((totalProjectsResult.count || 0) / totalTenants) * 10) / 10;

    // Calculate conversion rate (paid tenants / total tenants)
    const paidTenants = planCounts.starter + planCounts.professional + planCounts.business;
    const conversionRate = totalTenants > 0 ? Math.round((paidTenants / totalTenants) * 100) : 0;

    // Task completion rate
    const totalTasks = totalTasksResult.count || 0;
    const completedTasks = completedTasksResult.count || 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const recentUsers = (recentUsersResult.data || []).map((u) => ({
      id: u.id,
      email: u.email || "",
      full_name: [u.first_name, u.last_name].filter(Boolean).join(" ") || "",
      created_at: u.created_at,
      tenant_name: (Array.isArray(u.tenants) ? u.tenants[0]?.name : (u.tenants as { name: string } | null)?.name) || "Unknown",
    }));

    return NextResponse.json({
      stats: {
        totalTenants: totalTenantsResult.count || 0,
        activeTenants: activeTenantsResult.count || 0,
        totalUsers: totalUsersResult.count || 0,
        totalProjects: totalProjectsResult.count || 0,
        totalTasks: totalTasks,
        completedTasks: completedTasks,
        totalClients: totalClientsResult.count || 0,
        activeClients: activeClientsResult.count || 0,
        totalInvoices: totalInvoicesResult.count || 0,
        paidInvoices: paidInvoicesResult.count || 0,
        mrr,
        totalInvoiced,
        totalPaid,
        newTenantsThisMonth: tenantsThisMonth,
        newUsersThisMonth: usersThisMonth,
        tenantGrowthPercent,
        userGrowthPercent,
        avgUsersPerTenant,
        avgProjectsPerTenant,
        conversionRate,
        taskCompletionRate,
      },
      weeklyActivity: {
        projects: newProjectsThisWeek.count || 0,
        tasks: newTasksThisWeek.count || 0,
        invoices: newInvoicesThisWeek.count || 0,
      },
      charts: {
        months: last6Months,
        tenantGrowth,
        userGrowth,
        planDistribution: planCounts,
      },
      topTenants,
      recentTenants: recentTenantsResult.data || [],
      recentUsers,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
