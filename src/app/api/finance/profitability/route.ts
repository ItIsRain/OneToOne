import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeClient(row: any): { id: string; name: string; company: string | null } | null {
  const c = row?.client;
  if (!c) return null;
  if (Array.isArray(c)) return c[0] || null;
  return c;
}

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const tenantId = profile.tenant_id;

    // Fetch all data in parallel
    const [projectsRes, invoicesRes, timeEntriesRes, expensesRes, membersRes] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, project_code, status, budget, currency, billing_type, hourly_rate, estimated_hours, start_date, end_date, client_id, client:clients(id, name, company)")
        .eq("tenant_id", tenantId)
        .not("status", "eq", "cancelled"),

      supabase
        .from("invoices")
        .select("id, project_id, total, amount, amount_paid, status, currency, issue_date")
        .eq("tenant_id", tenantId)
        .not("status", "in", '("draft","cancelled","refunded")'),

      supabase
        .from("time_entries")
        .select("id, project_id, user_id, duration_minutes, hourly_rate, is_billable, date, status")
        .eq("tenant_id", tenantId)
        .not("status", "eq", "rejected"),

      supabase
        .from("expenses")
        .select("id, project_id, amount, category, status, expense_date, description, is_billable")
        .eq("tenant_id", tenantId)
        .not("status", "eq", "rejected"),

      // Member hourly rates as fallback for time entries without rates
      supabase
        .from("profiles")
        .select("id, hourly_rate")
        .eq("tenant_id", tenantId),
    ]);

    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];
    const timeEntries = timeEntriesRes.data || [];
    const expenses = expensesRes.data || [];
    const members = membersRes.data || [];

    // Build member rate lookup
    const memberRates: Record<string, number> = {};
    for (const m of members) {
      memberRates[m.id] = m.hourly_rate || 0;
    }

    // Aggregate invoices by project_id
    const revenueByProject: Record<string, { total: number; paid: number; count: number }> = {};
    for (const inv of invoices) {
      if (!inv.project_id) continue;
      if (!revenueByProject[inv.project_id]) {
        revenueByProject[inv.project_id] = { total: 0, paid: 0, count: 0 };
      }
      revenueByProject[inv.project_id].total += inv.total || inv.amount || 0;
      revenueByProject[inv.project_id].paid += inv.amount_paid || 0;
      revenueByProject[inv.project_id].count += 1;
    }

    // Aggregate time entries by project_id
    const laborByProject: Record<string, { cost: number; hours: number; billableHours: number; entryCount: number }> = {};
    for (const te of timeEntries) {
      if (!te.project_id) continue;
      if (!laborByProject[te.project_id]) {
        laborByProject[te.project_id] = { cost: 0, hours: 0, billableHours: 0, entryCount: 0 };
      }
      const hours = (te.duration_minutes || 0) / 60;
      const rate = te.hourly_rate || memberRates[te.user_id] || 0;
      laborByProject[te.project_id].cost += hours * rate;
      laborByProject[te.project_id].hours += hours;
      if (te.is_billable) laborByProject[te.project_id].billableHours += hours;
      laborByProject[te.project_id].entryCount += 1;
    }

    // Aggregate expenses by project_id
    const expensesByProject: Record<string, { total: number; billable: number; count: number; categories: Record<string, number> }> = {};
    for (const exp of expenses) {
      if (!exp.project_id) continue;
      if (!expensesByProject[exp.project_id]) {
        expensesByProject[exp.project_id] = { total: 0, billable: 0, count: 0, categories: {} };
      }
      const amount = exp.amount || 0;
      expensesByProject[exp.project_id].total += amount;
      if (exp.is_billable) expensesByProject[exp.project_id].billable += amount;
      expensesByProject[exp.project_id].count += 1;
      const cat = exp.category || "Other";
      expensesByProject[exp.project_id].categories[cat] = (expensesByProject[exp.project_id].categories[cat] || 0) + amount;
    }

    // Build per-project profitability
    const projectProfitability = projects.map((proj) => {
      const revenue = revenueByProject[proj.id] || { total: 0, paid: 0, count: 0 };
      const labor = laborByProject[proj.id] || { cost: 0, hours: 0, billableHours: 0, entryCount: 0 };
      const expense = expensesByProject[proj.id] || { total: 0, billable: 0, count: 0, categories: {} };

      const totalRevenue = revenue.total;
      const totalCost = labor.cost + expense.total;
      const profit = totalRevenue - totalCost;
      const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 1000) / 10 : 0;
      const laborPercent = totalRevenue > 0 ? Math.round((labor.cost / totalRevenue) * 1000) / 10 : 0;
      const expensePercent = totalRevenue > 0 ? Math.round((expense.total / totalRevenue) * 1000) / 10 : 0;
      const budgetUsed = proj.budget && proj.budget > 0 ? Math.round((totalCost / proj.budget) * 1000) / 10 : null;

      const client = safeClient(proj);

      return {
        id: proj.id,
        name: proj.name,
        project_code: proj.project_code,
        status: proj.status,
        billing_type: proj.billing_type,
        currency: proj.currency || "USD",
        client_name: client?.name || null,
        client_company: client?.company || null,
        budget: proj.budget,
        estimated_hours: proj.estimated_hours,
        start_date: proj.start_date,
        end_date: proj.end_date,

        // Revenue
        revenue: Math.round(totalRevenue * 100) / 100,
        revenue_paid: Math.round(revenue.paid * 100) / 100,
        invoice_count: revenue.count,

        // Labor
        labor_cost: Math.round(labor.cost * 100) / 100,
        labor_hours: Math.round(labor.hours * 10) / 10,
        billable_hours: Math.round(labor.billableHours * 10) / 10,
        time_entry_count: labor.entryCount,

        // Expenses
        expense_cost: Math.round(expense.total * 100) / 100,
        billable_expenses: Math.round(expense.billable * 100) / 100,
        expense_count: expense.count,
        expense_categories: expense.categories,

        // Profitability
        total_cost: Math.round(totalCost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin,
        labor_percent: laborPercent,
        expense_percent: expensePercent,
        budget_used_percent: budgetUsed,
      };
    });

    // Sort by profit descending
    projectProfitability.sort((a, b) => b.profit - a.profit);

    // Summary
    const withRevenue = projectProfitability.filter((p) => p.revenue > 0);
    const totalRevenue = projectProfitability.reduce((s, p) => s + p.revenue, 0);
    const totalLaborCost = projectProfitability.reduce((s, p) => s + p.labor_cost, 0);
    const totalExpenseCost = projectProfitability.reduce((s, p) => s + p.expense_cost, 0);
    const totalCost = totalLaborCost + totalExpenseCost;
    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;
    const avgMargin = withRevenue.length > 0
      ? Math.round((withRevenue.reduce((s, p) => s + p.margin, 0) / withRevenue.length) * 10) / 10
      : 0;

    const negativeMarginCount = projectProfitability.filter((p) => p.revenue > 0 && p.margin < 0).length;
    const decliningCount = projectProfitability.filter((p) => p.revenue > 0 && p.margin > 0 && p.margin < 20).length;

    // Client-level aggregation
    const clientMap: Record<string, { name: string; company: string | null; revenue: number; cost: number; profit: number; projects: number }> = {};
    for (const p of projectProfitability) {
      const key = p.client_name || "No Client";
      if (!clientMap[key]) {
        clientMap[key] = { name: key, company: p.client_company, revenue: 0, cost: 0, profit: 0, projects: 0 };
      }
      clientMap[key].revenue += p.revenue;
      clientMap[key].cost += p.total_cost;
      clientMap[key].profit += p.profit;
      clientMap[key].projects += 1;
    }
    const clientProfitability = Object.values(clientMap)
      .map((c) => ({
        ...c,
        margin: c.revenue > 0 ? Math.round((c.profit / c.revenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);

    return NextResponse.json({
      projects: projectProfitability,
      clients: clientProfitability,
      summary: {
        project_count: projects.length,
        projects_with_revenue: withRevenue.length,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        total_labor_cost: Math.round(totalLaborCost * 100) / 100,
        total_expense_cost: Math.round(totalExpenseCost * 100) / 100,
        total_cost: Math.round(totalCost * 100) / 100,
        total_profit: Math.round(totalProfit * 100) / 100,
        overall_margin: overallMargin,
        avg_margin: avgMargin,
        negative_margin_count: negativeMarginCount,
        low_margin_count: decliningCount,
      },
    });
  } catch (error) {
    console.error("Profitability error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
