import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Compute revenue forecast & cash flow projections
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
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Projection horizon dates
    const day30 = new Date(now);
    day30.setDate(day30.getDate() + 30);
    const day60 = new Date(now);
    day60.setDate(day60.getDate() + 60);
    const day90 = new Date(now);
    day90.setDate(day90.getDate() + 90);
    const day30Str = day30.toISOString().split("T")[0];
    const day60Str = day60.toISOString().split("T")[0];
    const day90Str = day90.toISOString().split("T")[0];

    // Historical window for expense averaging (last 6 months)
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

    // Fetch all data in parallel
    const [
      { data: invoices },
      { data: leads },
      { data: proposals },
      { data: contracts },
      { data: expenses },
      { data: payments },
    ] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, invoice_number, total, amount, amount_paid, due_date, status, currency, client_id, clients(name)")
        .eq("tenant_id", tenantId)
        .in("status", ["sent", "viewed", "overdue", "partially_paid"]),
      supabase
        .from("leads")
        .select("id, name, company, estimated_value, probability, expected_close_date, status, source")
        .eq("tenant_id", tenantId)
        .in("status", ["new", "qualification", "proposal", "negotiation"]),
      supabase
        .from("proposals")
        .select("id, title, pricing_items, status, valid_until, currency, client_id, clients(name)")
        .eq("tenant_id", tenantId)
        .in("status", ["sent", "viewed"]),
      supabase
        .from("contracts")
        .select("id, name, value, start_date, end_date, status, currency, client_id, clients(name)")
        .eq("tenant_id", tenantId)
        .in("status", ["active"]),
      supabase
        .from("expenses")
        .select("id, amount, expense_date, category, status")
        .eq("tenant_id", tenantId)
        .neq("status", "rejected")
        .gte("expense_date", sixMonthsAgoStr),
      supabase
        .from("payments")
        .select("id, amount, payment_date, status")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("payment_date", sixMonthsAgoStr),
    ]);

    // Helper to extract client name from Supabase FK join
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function clientName(row: any): string {
      const c = row?.clients;
      if (!c) return "Unknown";
      if (Array.isArray(c)) return c[0]?.name || "Unknown";
      return c.name || "Unknown";
    }

    // ─── 1. Outstanding Invoices (expected collections by due date) ────
    const invoiceItems = (invoices || []).map((inv) => {
      const total = parseFloat(inv.total) || parseFloat(inv.amount) || 0;
      const paid = parseFloat(inv.amount_paid) || 0;
      const outstanding = total - paid;
      const dueDate = inv.due_date || todayStr;
      // Collection probability based on status
      const probability =
        inv.status === "overdue" ? 0.7 : inv.status === "partially_paid" ? 0.9 : 0.85;
      return {
        id: inv.id,
        label: inv.invoice_number,
        client: clientName(inv),
        amount: outstanding,
        weightedAmount: outstanding * probability,
        dueDate,
        probability,
        status: inv.status,
        currency: inv.currency || "USD",
      };
    });

    // ─── 2. Pipeline Deals (leads weighted by probability) ─────────────
    const pipelineItems = (leads || []).map((lead) => {
      const value = parseFloat(String(lead.estimated_value)) || 0;
      const prob = (lead.probability || 0) / 100;
      return {
        id: lead.id,
        label: lead.name,
        company: lead.company || null,
        amount: value,
        weightedAmount: value * prob,
        probability: lead.probability || 0,
        expectedClose: lead.expected_close_date || day60Str,
        status: lead.status,
        source: lead.source,
      };
    });

    // ─── 3. Pending Proposals (weighted by historical close rate) ──────
    const proposalItems = (proposals || []).map((prop) => {
      // Calculate total from pricing_items
      let total = 0;
      if (Array.isArray(prop.pricing_items)) {
        for (const item of prop.pricing_items as Array<{ amount?: number; quantity?: number; unit_price?: number }>) {
          total += item.amount || (item.quantity || 1) * (item.unit_price || 0);
        }
      }
      // Default proposal close probability: 40% for sent, 55% for viewed
      const probability = prop.status === "viewed" ? 0.55 : 0.4;
      return {
        id: prop.id,
        label: prop.title,
        client: clientName(prop),
        amount: total,
        weightedAmount: total * probability,
        probability: Math.round(probability * 100),
        validUntil: prop.valid_until,
        status: prop.status,
        currency: prop.currency || "USD",
      };
    });

    // ─── 4. Active Contracts (recurring revenue projection) ────────────
    const contractItems = (contracts || []).map((contract) => {
      const value = parseFloat(String(contract.value)) || 0;
      const startDate = contract.start_date ? new Date(contract.start_date) : now;
      const endDate = contract.end_date ? new Date(contract.end_date) : day90;

      // Calculate monthly rate from contract value and duration
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMonths = Math.max(1, durationMs / (30 * 24 * 60 * 60 * 1000));
      const monthlyRate = value / durationMonths;

      // How many months remain within our 90-day window
      const windowEnd = endDate < day90 ? endDate : day90;
      const windowStart = startDate > now ? startDate : now;
      const remainingMs = Math.max(0, windowEnd.getTime() - windowStart.getTime());
      const remainingMonths = remainingMs / (30 * 24 * 60 * 60 * 1000);
      const projectedRevenue = monthlyRate * remainingMonths;

      return {
        id: contract.id,
        label: contract.name,
        client: clientName(contract),
        totalValue: value,
        monthlyRate,
        projectedRevenue,
        startDate: contract.start_date,
        endDate: contract.end_date,
        currency: contract.currency || "USD",
      };
    });

    // ─── 5. Expense Projection (based on historical average) ──────────
    const allExpenses = expenses || [];
    const totalHistoricalExpenses = allExpenses.reduce(
      (sum, e) => sum + (parseFloat(e.amount) || 0),
      0
    );
    // Calculate months of data we have
    const oldestExpenseDate = allExpenses.length > 0
      ? allExpenses.reduce((min, e) => (e.expense_date < min ? e.expense_date : min), allExpenses[0].expense_date)
      : sixMonthsAgoStr;
    const expenseMonths = Math.max(
      1,
      (now.getTime() - new Date(oldestExpenseDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
    const avgMonthlyExpenses = totalHistoricalExpenses / expenseMonths;

    // Expenses by category for breakdown
    const expensesByCategory: Record<string, number> = {};
    for (const e of allExpenses) {
      const cat = e.category || "other";
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (parseFloat(e.amount) || 0);
    }
    // Convert to monthly averages
    const monthlyCategoryExpenses: Record<string, number> = {};
    for (const [cat, total] of Object.entries(expensesByCategory)) {
      monthlyCategoryExpenses[cat] = total / expenseMonths;
    }

    // ─── 6. Historical Revenue for trend (last 6 months) ──────────────
    const allPayments = payments || [];
    const monthlyRevenue: Array<{ month: string; monthKey: string; revenue: number; expenses: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const mStartStr = mStart.toISOString().split("T")[0];
      const mEndStr = mEnd.toISOString().split("T")[0];

      const rev = allPayments
        .filter((p) => p.payment_date >= mStartStr && p.payment_date <= mEndStr)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      const exp = allExpenses
        .filter((e) => e.expense_date >= mStartStr && e.expense_date <= mEndStr)
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      monthlyRevenue.push({
        month: mStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        monthKey: mStartStr,
        revenue: rev,
        expenses: exp,
      });
    }

    // ─── 7. Build 30/60/90 day projections ────────────────────────────
    function bucketAmount(
      items: Array<{ amount: number; weightedAmount: number; date: string }>
    ) {
      let d30 = 0, d60 = 0, d90 = 0;
      for (const item of items) {
        if (item.date <= day30Str) d30 += item.weightedAmount;
        else if (item.date <= day60Str) d60 += item.weightedAmount;
        else if (item.date <= day90Str) d90 += item.weightedAmount;
      }
      return { d30, d60, d90, total: d30 + d60 + d90 };
    }

    const invoiceForecast = bucketAmount(
      invoiceItems.map((i) => ({ amount: i.amount, weightedAmount: i.weightedAmount, date: i.dueDate }))
    );
    const pipelineForecast = bucketAmount(
      pipelineItems.map((p) => ({ amount: p.amount, weightedAmount: p.weightedAmount, date: p.expectedClose }))
    );
    const proposalForecast = bucketAmount(
      proposalItems.map((p) => ({
        amount: p.amount,
        weightedAmount: p.weightedAmount,
        date: p.validUntil || day30Str,
      }))
    );

    // Contract revenue spread over months
    const contractD30 = contractItems.reduce((sum, c) => {
      const end = c.endDate ? new Date(c.endDate) : day90;
      const cutoff = end < day30 ? end : day30;
      const start = c.startDate && new Date(c.startDate) > now ? new Date(c.startDate) : now;
      const months = Math.max(0, (cutoff.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
      return sum + c.monthlyRate * months;
    }, 0);
    const contractD60 = contractItems.reduce((sum, c) => {
      const end = c.endDate ? new Date(c.endDate) : day90;
      const cutoff = end < day60 ? end : day60;
      const start = c.startDate && new Date(c.startDate) > now ? new Date(c.startDate) : now;
      const months = Math.max(0, (cutoff.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
      return sum + c.monthlyRate * months;
    }, 0) - contractD30;
    const contractD90 = contractItems.reduce((sum, c) => sum + c.projectedRevenue, 0) - contractD30 - contractD60;

    const contractForecast = {
      d30: contractD30,
      d60: contractD60,
      d90: contractD90,
      total: contractD30 + contractD60 + contractD90,
    };

    const expenseForecast = {
      d30: avgMonthlyExpenses,
      d60: avgMonthlyExpenses,
      d90: avgMonthlyExpenses,
      total: avgMonthlyExpenses * 3,
    };

    // Total inflow projections
    const totalInflow = {
      d30: invoiceForecast.d30 + pipelineForecast.d30 + proposalForecast.d30 + contractForecast.d30,
      d60: invoiceForecast.d60 + pipelineForecast.d60 + proposalForecast.d60 + contractForecast.d60,
      d90: invoiceForecast.d90 + pipelineForecast.d90 + proposalForecast.d90 + contractForecast.d90,
    };
    totalInflow.d60 += totalInflow.d30; // cumulative
    totalInflow.d90 += totalInflow.d60;

    const totalOutflow = {
      d30: expenseForecast.d30,
      d60: expenseForecast.d30 + expenseForecast.d60,
      d90: expenseForecast.d30 + expenseForecast.d60 + expenseForecast.d90,
    };

    const netCashFlow = {
      d30: totalInflow.d30 - totalOutflow.d30,
      d60: totalInflow.d60 - totalOutflow.d60,
      d90: totalInflow.d90 - totalOutflow.d90,
    };

    // ─── 8. Build weekly cash flow timeline (12 weeks) ─────────────────
    const weeklyTimeline: Array<{
      week: string;
      weekStart: string;
      inflow: number;
      outflow: number;
      net: number;
      cumulative: number;
    }> = [];

    const weeklyExpense = avgMonthlyExpenses / 4.33;
    let cumulative = 0;

    for (let w = 0; w < 12; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const weekEndStr = weekEnd.toISOString().split("T")[0];

      // Invoice collections due this week
      const weekInvoices = invoiceItems
        .filter((i) => i.dueDate >= weekStartStr && i.dueDate < weekEndStr)
        .reduce((sum, i) => sum + i.weightedAmount, 0);

      // Pipeline deals expected this week
      const weekPipeline = pipelineItems
        .filter((p) => p.expectedClose >= weekStartStr && p.expectedClose < weekEndStr)
        .reduce((sum, p) => sum + p.weightedAmount, 0);

      // Proposal conversions this week
      const weekProposals = proposalItems
        .filter((p) => {
          const date = p.validUntil || day30Str;
          return date >= weekStartStr && date < weekEndStr;
        })
        .reduce((sum, p) => sum + p.weightedAmount, 0);

      // Contract revenue this week
      const weekContracts = contractItems.reduce((sum, c) => {
        const cStart = c.startDate ? new Date(c.startDate) : now;
        const cEnd = c.endDate ? new Date(c.endDate) : day90;
        if (cStart > weekEnd || cEnd < weekStart) return sum;
        return sum + c.monthlyRate / 4.33;
      }, 0);

      const inflow = weekInvoices + weekPipeline + weekProposals + weekContracts;
      const outflow = weeklyExpense;
      const net = inflow - outflow;
      cumulative += net;

      weeklyTimeline.push({
        week: `Wk ${w + 1}`,
        weekStart: weekStartStr,
        inflow: Math.round(inflow * 100) / 100,
        outflow: Math.round(outflow * 100) / 100,
        net: Math.round(net * 100) / 100,
        cumulative: Math.round(cumulative * 100) / 100,
      });
    }

    return NextResponse.json({
      // Summary projections
      projections: {
        inflow: totalInflow,
        outflow: totalOutflow,
        net: netCashFlow,
      },
      // Breakdown by source
      sources: {
        invoices: {
          forecast: invoiceForecast,
          count: invoiceItems.length,
          items: invoiceItems.slice(0, 10), // top 10
        },
        pipeline: {
          forecast: pipelineForecast,
          count: pipelineItems.length,
          items: pipelineItems.slice(0, 10),
        },
        proposals: {
          forecast: proposalForecast,
          count: proposalItems.length,
          items: proposalItems.slice(0, 10),
        },
        contracts: {
          forecast: contractForecast,
          count: contractItems.length,
          items: contractItems.slice(0, 10),
        },
        expenses: {
          forecast: expenseForecast,
          avgMonthly: avgMonthlyExpenses,
          byCategory: monthlyCategoryExpenses,
        },
      },
      // Timeline data
      weeklyTimeline,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Revenue forecast error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
