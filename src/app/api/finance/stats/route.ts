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

// GET - Fetch finance statistics
export async function GET(request: Request) {
  try {
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

    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

    // Fetch all invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("tenant_id", tenantId);

    // Fetch all expenses
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("tenant_id", tenantId);

    // Fetch all payments
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("tenant_id", tenantId);

    // Calculate invoice stats
    const invoiceStats = {
      total: invoices?.length || 0,
      draft: invoices?.filter(i => i.status === 'draft').length || 0,
      sent: invoices?.filter(i => i.status === 'sent' || i.status === 'viewed').length || 0,
      paid: invoices?.filter(i => i.status === 'paid').length || 0,
      overdue: invoices?.filter(i => i.status === 'overdue').length || 0,
      partiallyPaid: invoices?.filter(i => i.status === 'partially_paid').length || 0,
    };

    // Calculate financial totals
    const totalInvoiced = invoices
      ?.filter(i => !['draft', 'cancelled', 'refunded'].includes(i.status))
      .reduce((sum, i) => sum + (parseFloat(i.total) || parseFloat(i.amount) || 0), 0) || 0;

    const totalCollected = payments
      ?.filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    const totalOutstanding = invoices
      ?.filter(i => ['sent', 'viewed', 'overdue', 'partially_paid'].includes(i.status))
      .reduce((sum, i) => {
        const total = parseFloat(i.total) || parseFloat(i.amount) || 0;
        const paid = parseFloat(i.amount_paid) || 0;
        return sum + (total - paid);
      }, 0) || 0;

    const totalOverdue = invoices
      ?.filter(i => i.status === 'overdue')
      .reduce((sum, i) => {
        const total = parseFloat(i.total) || parseFloat(i.amount) || 0;
        const paid = parseFloat(i.amount_paid) || 0;
        return sum + (total - paid);
      }, 0) || 0;

    // This month stats
    const invoicedThisMonth = invoices
      ?.filter(i => i.issue_date >= startOfMonth && !['draft', 'cancelled', 'refunded'].includes(i.status))
      .reduce((sum, i) => sum + (parseFloat(i.total) || parseFloat(i.amount) || 0), 0) || 0;

    const collectedThisMonth = payments
      ?.filter(p => p.payment_date >= startOfMonth && p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    // Last month stats for comparison
    const invoicedLastMonth = invoices
      ?.filter(i => i.issue_date >= startOfLastMonth && i.issue_date <= endOfLastMonth && !['draft', 'cancelled', 'refunded'].includes(i.status))
      .reduce((sum, i) => sum + (parseFloat(i.total) || parseFloat(i.amount) || 0), 0) || 0;

    const collectedLastMonth = payments
      ?.filter(p => p.payment_date >= startOfLastMonth && p.payment_date <= endOfLastMonth && p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    // YTD stats
    const invoicedYTD = invoices
      ?.filter(i => i.issue_date >= startOfYear && !['draft', 'cancelled', 'refunded'].includes(i.status))
      .reduce((sum, i) => sum + (parseFloat(i.total) || parseFloat(i.amount) || 0), 0) || 0;

    const collectedYTD = payments
      ?.filter(p => p.payment_date >= startOfYear && p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    // Expense stats
    const totalExpenses = expenses
      ?.filter(e => e.status !== 'rejected')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;

    const expensesThisMonth = expenses
      ?.filter(e => e.expense_date >= startOfMonth && e.status !== 'rejected')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;

    const expensesLastMonth = expenses
      ?.filter(e => e.expense_date >= startOfLastMonth && e.expense_date <= endOfLastMonth && e.status !== 'rejected')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;

    const expensesYTD = expenses
      ?.filter(e => e.expense_date >= startOfYear && e.status !== 'rejected')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;

    // Expenses by category
    const expensesByCategory = expenses
      ?.filter(e => e.status !== 'rejected')
      .reduce((acc, e) => {
        const category = e.category || 'other';
        acc[category] = (acc[category] || 0) + (parseFloat(e.amount) || 0);
        return acc;
      }, {} as Record<string, number>) || {};

    // Net profit calculations
    const netProfitThisMonth = collectedThisMonth - expensesThisMonth;
    const netProfitLastMonth = collectedLastMonth - expensesLastMonth;
    const netProfitYTD = collectedYTD - expensesYTD;

    // Recent invoices
    const recentInvoices = invoices
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) || [];

    // Recent payments
    const recentPayments = payments
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) || [];

    // Monthly revenue data for charts (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];

      const revenue = payments
        ?.filter(p => p.payment_date >= monthStartStr && p.payment_date <= monthEndStr && p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

      const expenseAmount = expenses
        ?.filter(e => e.expense_date >= monthStartStr && e.expense_date <= monthEndStr && e.status !== 'rejected')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
        expenses: expenseAmount,
        profit: revenue - expenseAmount,
      });
    }

    // Calculate growth percentages
    const revenueGrowth = invoicedLastMonth > 0
      ? ((invoicedThisMonth - invoicedLastMonth) / invoicedLastMonth) * 100
      : 0;

    const collectionGrowth = collectedLastMonth > 0
      ? ((collectedThisMonth - collectedLastMonth) / collectedLastMonth) * 100
      : 0;

    const expenseGrowth = expensesLastMonth > 0
      ? ((expensesThisMonth - expensesLastMonth) / expensesLastMonth) * 100
      : 0;

    return NextResponse.json({
      invoiceStats,
      totals: {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        totalOverdue,
        totalExpenses,
      },
      thisMonth: {
        invoiced: invoicedThisMonth,
        collected: collectedThisMonth,
        expenses: expensesThisMonth,
        netProfit: netProfitThisMonth,
      },
      lastMonth: {
        invoiced: invoicedLastMonth,
        collected: collectedLastMonth,
        expenses: expensesLastMonth,
        netProfit: netProfitLastMonth,
      },
      yearToDate: {
        invoiced: invoicedYTD,
        collected: collectedYTD,
        expenses: expensesYTD,
        netProfit: netProfitYTD,
      },
      growth: {
        revenue: revenueGrowth,
        collection: collectionGrowth,
        expenses: expenseGrowth,
      },
      expensesByCategory,
      monthlyData,
      recentInvoices,
      recentPayments,
    });
  } catch (error) {
    console.error("Get finance stats error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
