import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/hooks/useTenantFromHeaders";

export async function GET(request: Request) {
  try {
    // Use user ID from middleware header (already validated) to skip getUser() call
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all data in parallel
    const [
      clientsResult,
      clientsLastMonthResult,
      invoicesResult,
      projectsResult,
      tasksResult,
      paymentsThisMonth,
      paymentsLastMonth,
      leadsResult,
      leadsLastMonthResult,
      proposalsResult,
      teamMembersResult,
      timeEntriesResult,
      contractsResult,
      expensesThisMonth,
      expensesLastMonth,
    ] = await Promise.all([
      // Active clients
      supabase
        .from("clients")
        .select("id, status, created_at")
        .eq("tenant_id", tenantId),

      // Clients from last period (for retention)
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .lt("created_at", startOfMonth),

      // All invoices
      supabase
        .from("invoices")
        .select("id, status, total, amount_paid, due_date, created_at")
        .eq("tenant_id", tenantId),

      // All projects
      supabase
        .from("projects")
        .select("id, status, progress_percentage, deadline, budget, created_at")
        .eq("tenant_id", tenantId),

      // All tasks
      supabase
        .from("tasks")
        .select("id, status, due_date, priority, created_at")
        .eq("tenant_id", tenantId),

      // Revenue this month
      supabase
        .from("payments")
        .select("amount")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("payment_date", startOfMonth),

      // Revenue last month
      supabase
        .from("payments")
        .select("amount")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("payment_date", startOfLastMonth)
        .lt("payment_date", endOfLastMonth),

      // Leads this month
      supabase
        .from("leads")
        .select("id, status, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", startOfMonth),

      // Leads last month
      supabase
        .from("leads")
        .select("id, status, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", startOfLastMonth)
        .lt("created_at", endOfLastMonth),

      // Proposals
      supabase
        .from("proposals")
        .select("id, status, total, created_at")
        .eq("tenant_id", tenantId),

      // Team members
      supabase
        .from("profiles")
        .select("id")
        .eq("tenant_id", tenantId),

      // Time entries (last 30 days)
      supabase
        .from("time_entries")
        .select("id, duration_minutes, is_billable, date")
        .eq("tenant_id", tenantId)
        .gte("date", thirtyDaysAgo),

      // Contracts
      supabase
        .from("contracts")
        .select("id, status")
        .eq("tenant_id", tenantId),

      // Expenses this month
      supabase
        .from("expenses")
        .select("amount, expense_date")
        .eq("tenant_id", tenantId)
        .gte("expense_date", startOfMonth),

      // Expenses last month
      supabase
        .from("expenses")
        .select("amount, expense_date")
        .eq("tenant_id", tenantId)
        .gte("expense_date", startOfLastMonth)
        .lt("expense_date", endOfLastMonth),
    ]);

    const clients = clientsResult.data || [];
    const invoices = invoicesResult.data || [];
    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const leads = leadsResult.data || [];
    const leadsLastMonth = leadsLastMonthResult.data || [];
    const proposals = proposalsResult.data || [];
    const timeEntries = timeEntriesResult.data || [];
    const contracts = contractsResult.data || [];

    // ═══════════════════════════════════════════════════
    // 1. FINANCIAL HEALTH (25%)
    // ═══════════════════════════════════════════════════

    const revenueThisMonth = (paymentsThisMonth.data || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const revenueLastMonth = (paymentsLastMonth.data || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const expThisMonth = (expensesThisMonth.data || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const expLastMonth = (expensesLastMonth.data || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    // Revenue trend score (0-100)
    let revenueTrendScore: number;
    if (revenueLastMonth === 0) {
      revenueTrendScore = revenueThisMonth > 0 ? 80 : 50;
    } else {
      const growth = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
      if (growth >= 20) revenueTrendScore = 100;
      else if (growth >= 10) revenueTrendScore = 90;
      else if (growth >= 0) revenueTrendScore = 75;
      else if (growth >= -10) revenueTrendScore = 55;
      else if (growth >= -25) revenueTrendScore = 35;
      else revenueTrendScore = 15;
    }

    // AR aging score (based on overdue invoices)
    const overdueInvoices = invoices.filter((i) => i.status === "overdue");
    const totalOutstanding = invoices
      .filter((i) => ["sent", "viewed", "partially_paid", "overdue"].includes(i.status))
      .reduce((s, i) => s + ((i.total || 0) - (i.amount_paid || 0)), 0);
    const overdueAmount = overdueInvoices.reduce((s, i) => s + ((i.total || 0) - (i.amount_paid || 0)), 0);

    let arAgingScore: number;
    if (totalOutstanding === 0) {
      arAgingScore = 100;
    } else {
      const overdueRatio = overdueAmount / Math.max(totalOutstanding, 1);
      arAgingScore = Math.max(0, Math.round(100 - overdueRatio * 100));
    }

    // Cash flow score (revenue vs expenses ratio)
    let cashFlowScore: number;
    if (revenueThisMonth === 0 && expThisMonth === 0) {
      cashFlowScore = 50;
    } else if (expThisMonth === 0) {
      cashFlowScore = 100;
    } else {
      const ratio = revenueThisMonth / expThisMonth;
      if (ratio >= 3) cashFlowScore = 100;
      else if (ratio >= 2) cashFlowScore = 90;
      else if (ratio >= 1.5) cashFlowScore = 80;
      else if (ratio >= 1) cashFlowScore = 65;
      else if (ratio >= 0.7) cashFlowScore = 40;
      else cashFlowScore = 20;
    }

    // Invoice collection rate
    const paidInvoices = invoices.filter((i) => i.status === "paid").length;
    const totalInvoices = invoices.filter((i) => i.status !== "draft").length;
    const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 50;

    const financialScore = Math.round(
      revenueTrendScore * 0.3 +
      arAgingScore * 0.25 +
      cashFlowScore * 0.25 +
      collectionRate * 0.2
    );

    const financialDetails = {
      revenueThisMonth,
      revenueLastMonth,
      revenueGrowth: revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : revenueThisMonth > 0 ? 100 : 0,
      totalOutstanding,
      overdueAmount,
      overdueInvoiceCount: overdueInvoices.length,
      collectionRate: Math.round(collectionRate),
      cashFlowRatio: expThisMonth > 0 ? Math.round((revenueThisMonth / expThisMonth) * 100) / 100 : null,
    };

    // ═══════════════════════════════════════════════════
    // 2. OPERATIONAL HEALTH (25%)
    // ═══════════════════════════════════════════════════

    // Project on-time rate
    const completedProjects = projects.filter((p) => p.status === "completed");
    const projectsWithDeadline = completedProjects.filter((p) => p.deadline);
    let onTimeRate: number;
    if (projectsWithDeadline.length === 0) {
      onTimeRate = 70; // neutral
    } else {
      // We can't perfectly know if they were on time, so we'll use active projects' health
      const activeProjects = projects.filter((p) => ["active", "in_progress"].includes(p.status));
      const overdueProjects = activeProjects.filter(
        (p) => p.deadline && new Date(p.deadline) < now
      );
      onTimeRate = activeProjects.length > 0
        ? Math.round((1 - overdueProjects.length / activeProjects.length) * 100)
        : 70;
    }

    // Task completion rate (last 30 days)
    const recentTasks = tasks.filter(
      (t) => t.created_at && new Date(t.created_at) >= new Date(thirtyDaysAgo)
    );
    const completedTasks = recentTasks.filter(
      (t) => t.status === "completed"
    );
    const taskCompletionRate = recentTasks.length > 0
      ? Math.round((completedTasks.length / recentTasks.length) * 100)
      : 50;

    // Overdue task ratio
    const overdueTasks = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && !["completed", "cancelled"].includes(t.status)
    );
    const activeTasks = tasks.filter((t) => !["completed", "cancelled"].includes(t.status));
    const overdueTaskRatio = activeTasks.length > 0
      ? overdueTasks.length / activeTasks.length
      : 0;
    const overdueTaskScore = Math.max(0, Math.round(100 - overdueTaskRatio * 150));

    // Team utilization (based on time entries)
    const teamCount = (teamMembersResult.data || []).length;
    const totalHours = timeEntries.reduce((s, t) => s + ((t.duration_minutes || 0) / 60), 0);
    const workingDaysInMonth = 22;
    const expectedHoursPerPerson = workingDaysInMonth * 8;
    const expectedTotalHours = teamCount * expectedHoursPerPerson;
    const utilizationRate = expectedTotalHours > 0
      ? Math.min(100, Math.round((totalHours / expectedTotalHours) * 100))
      : 50;

    // Utilization score (sweet spot is 70-85%)
    let utilizationScore: number;
    if (utilizationRate >= 70 && utilizationRate <= 85) utilizationScore = 100;
    else if (utilizationRate >= 60 && utilizationRate <= 90) utilizationScore = 85;
    else if (utilizationRate >= 50 && utilizationRate <= 95) utilizationScore = 70;
    else if (utilizationRate >= 40) utilizationScore = 55;
    else utilizationScore = 35;

    const operationalScore = Math.round(
      onTimeRate * 0.3 +
      taskCompletionRate * 0.25 +
      overdueTaskScore * 0.25 +
      utilizationScore * 0.2
    );

    const operationalDetails = {
      activeProjects: projects.filter((p) => ["active", "in_progress"].includes(p.status)).length,
      overdueProjects: projects.filter(
        (p) => ["active", "in_progress"].includes(p.status) && p.deadline && new Date(p.deadline) < now
      ).length,
      onTimeRate,
      taskCompletionRate,
      overdueTasks: overdueTasks.length,
      activeTasks: activeTasks.length,
      utilizationRate,
      teamSize: teamCount,
    };

    // ═══════════════════════════════════════════════════
    // 3. CLIENT HEALTH (25%)
    // ═══════════════════════════════════════════════════

    const activeClients = clients.filter((c) => c.status === "active");
    const totalClients = clients.length;

    // Client retention rate
    const previousClientCount = clientsLastMonthResult.count || 0;
    const stillActive = activeClients.filter(
      (c) => c.created_at && new Date(c.created_at) < new Date(startOfMonth)
    ).length;
    const retentionRate = previousClientCount > 0
      ? Math.min(100, Math.round((stillActive / previousClientCount) * 100))
      : totalClients > 0 ? 80 : 50;

    // New clients this month
    const newClientsThisMonth = clients.filter(
      (c) => c.created_at && new Date(c.created_at) >= new Date(startOfMonth)
    ).length;

    // Active contract coverage
    const activeContracts = contracts.filter((c) => c.status === "active").length;
    const contractCoverage = activeClients.length > 0
      ? Math.min(100, Math.round((activeContracts / activeClients.length) * 100))
      : 50;

    // Client-to-overdue-invoice ratio (lower is better)
    const clientsWithOverdue = new Set(
      overdueInvoices.map((i) => {
        // Invoices may not have client_id in our select, use what we have
        return i.id;
      })
    ).size;
    const clientOverdueScore = activeClients.length > 0
      ? Math.max(0, Math.round(100 - (overdueInvoices.length / Math.max(activeClients.length, 1)) * 50))
      : 70;

    const clientScore = Math.round(
      retentionRate * 0.35 +
      contractCoverage * 0.25 +
      clientOverdueScore * 0.2 +
      (activeClients.length > 0 ? 80 : 30) * 0.2
    );

    const clientDetails = {
      totalClients,
      activeClients: activeClients.length,
      newThisMonth: newClientsThisMonth,
      retentionRate,
      contractCoverage,
      activeContracts,
    };

    // ═══════════════════════════════════════════════════
    // 4. GROWTH HEALTH (25%)
    // ═══════════════════════════════════════════════════

    // Lead volume trend
    const leadsThisMonth = leads.length;
    const leadsLastMonthCount = leadsLastMonth.length;
    let leadVolumeScore: number;
    if (leadsLastMonthCount === 0) {
      leadVolumeScore = leadsThisMonth > 0 ? 80 : 40;
    } else {
      const leadGrowth = ((leadsThisMonth - leadsLastMonthCount) / leadsLastMonthCount) * 100;
      if (leadGrowth >= 20) leadVolumeScore = 100;
      else if (leadGrowth >= 0) leadVolumeScore = 75;
      else if (leadGrowth >= -20) leadVolumeScore = 55;
      else leadVolumeScore = 30;
    }

    // Lead conversion (leads that became clients)
    const convertedLeads = leads.filter((l) => l.status === "converted" || l.status === "won").length;
    const totalLeadsForConversion = [...leads, ...leadsLastMonth].length;
    const conversionRate = totalLeadsForConversion > 0
      ? Math.round((convertedLeads / totalLeadsForConversion) * 100)
      : 50;

    // Pipeline value (open proposals)
    const openProposals = proposals.filter(
      (p) => ["sent", "viewed", "draft"].includes(p.status)
    );
    const pipelineValue = openProposals.reduce((s, p) => s + (p.total || 0), 0);
    const wonProposals = proposals.filter((p) => p.status === "accepted");
    const proposalWinRate = proposals.filter((p) => p.status !== "draft").length > 0
      ? Math.round(
          (wonProposals.length / proposals.filter((p) => p.status !== "draft").length) * 100
        )
      : 50;

    // Client growth rate
    let clientGrowthScore: number;
    if (previousClientCount === 0) {
      clientGrowthScore = newClientsThisMonth > 0 ? 85 : 40;
    } else {
      const growthRate = (newClientsThisMonth / previousClientCount) * 100;
      if (growthRate >= 15) clientGrowthScore = 100;
      else if (growthRate >= 8) clientGrowthScore = 85;
      else if (growthRate >= 3) clientGrowthScore = 70;
      else if (growthRate > 0) clientGrowthScore = 60;
      else clientGrowthScore = 35;
    }

    const growthScore = Math.round(
      leadVolumeScore * 0.25 +
      conversionRate * 0.25 +
      proposalWinRate * 0.25 +
      clientGrowthScore * 0.25
    );

    const growthDetails = {
      leadsThisMonth,
      leadsLastMonth: leadsLastMonthCount,
      leadGrowth: leadsLastMonthCount > 0
        ? Math.round(((leadsThisMonth - leadsLastMonthCount) / leadsLastMonthCount) * 100)
        : null,
      conversionRate,
      pipelineValue,
      openProposals: openProposals.length,
      proposalWinRate,
      newClients: newClientsThisMonth,
    };

    // ═══════════════════════════════════════════════════
    // COMPOSITE SCORE
    // ═══════════════════════════════════════════════════

    const overallScore = Math.round(
      financialScore * 0.25 +
      operationalScore * 0.25 +
      clientScore * 0.25 +
      growthScore * 0.25
    );

    // Determine overall grade
    let grade: string;
    let gradeLabel: string;
    if (overallScore >= 90) { grade = "A+"; gradeLabel = "Excellent"; }
    else if (overallScore >= 80) { grade = "A"; gradeLabel = "Strong"; }
    else if (overallScore >= 70) { grade = "B+"; gradeLabel = "Good"; }
    else if (overallScore >= 60) { grade = "B"; gradeLabel = "Fair"; }
    else if (overallScore >= 50) { grade = "C"; gradeLabel = "Needs Attention"; }
    else if (overallScore >= 40) { grade = "D"; gradeLabel = "At Risk"; }
    else { grade = "F"; gradeLabel = "Critical"; }

    // Top alerts
    const alerts: { type: "warning" | "danger" | "info" | "success"; message: string }[] = [];

    if (overdueInvoices.length > 0) {
      alerts.push({
        type: overdueInvoices.length > 3 ? "danger" : "warning",
        message: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""} totaling $${overdueAmount.toLocaleString()}`,
      });
    }
    if (overdueTasks.length > 5) {
      alerts.push({
        type: "warning",
        message: `${overdueTasks.length} overdue tasks need attention`,
      });
    }
    if (utilizationRate < 50 && teamCount > 0) {
      alerts.push({
        type: "info",
        message: `Team utilization is low at ${utilizationRate}%`,
      });
    }
    if (utilizationRate > 90 && teamCount > 0) {
      alerts.push({
        type: "warning",
        message: `Team is over-utilized at ${utilizationRate}% — risk of burnout`,
      });
    }
    if (retentionRate < 80 && previousClientCount > 3) {
      alerts.push({
        type: "danger",
        message: `Client retention dropped to ${retentionRate}%`,
      });
    }
    if (financialDetails.revenueGrowth < -15) {
      alerts.push({
        type: "danger",
        message: `Revenue declined ${Math.abs(financialDetails.revenueGrowth)}% vs last month`,
      });
    }
    if (newClientsThisMonth > 0) {
      alerts.push({
        type: "success",
        message: `${newClientsThisMonth} new client${newClientsThisMonth > 1 ? "s" : ""} acquired this month`,
      });
    }
    if (proposalWinRate >= 60 && wonProposals.length > 0) {
      alerts.push({
        type: "success",
        message: `Strong proposal win rate at ${proposalWinRate}%`,
      });
    }

    return NextResponse.json({
      score: overallScore,
      grade,
      gradeLabel,
      categories: {
        financial: {
          score: financialScore,
          label: "Financial",
          details: financialDetails,
        },
        operational: {
          score: operationalScore,
          label: "Operational",
          details: operationalDetails,
        },
        client: {
          score: clientScore,
          label: "Client",
          details: clientDetails,
        },
        growth: {
          score: growthScore,
          label: "Growth",
          details: growthDetails,
        },
      },
      alerts: alerts.slice(0, 5),
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Business health error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
