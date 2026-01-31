"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { FeatureGate } from "@/components/ui/FeatureGate";

interface FinanceStats {
  invoiceStats: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    partiallyPaid: number;
  };
  totals: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    totalOverdue: number;
    totalExpenses: number;
  };
  thisMonth: {
    invoiced: number;
    collected: number;
    expenses: number;
    netProfit: number;
  };
  lastMonth: {
    invoiced: number;
    collected: number;
    expenses: number;
    netProfit: number;
  };
  yearToDate: {
    invoiced: number;
    collected: number;
    expenses: number;
    netProfit: number;
  };
  growth: {
    revenue: number;
    collection: number;
    expenses: number;
  };
  expensesByCategory: Record<string, number>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  recentInvoices: Array<{
    id: string;
    invoice_number: string;
    total: number;
    amount: number;
    status: string;
    due_date: string;
    currency: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    payment_date: string;
    payment_method: string;
  }>;
}

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  sent: { label: "Sent", color: "primary" },
  viewed: { label: "Viewed", color: "primary" },
  paid: { label: "Paid", color: "success" },
  partially_paid: { label: "Partial", color: "warning" },
  overdue: { label: "Overdue", color: "error" },
  cancelled: { label: "Cancelled", color: "light" },
};

export default function FinanceOverviewPage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/stats");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch statistics");
      }

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <FeatureGate feature="finance">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Finance Overview
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Loading financial data...
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </FeatureGate>
    );
  }

  if (error) {
    return (
      <FeatureGate feature="finance">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Finance Overview
            </h1>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-error-500">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-2 text-brand-500 hover:text-brand-600"
            >
              Try again
            </button>
          </div>
        </div>
      </FeatureGate>
    );
  }

  const revenueGrowthPositive = (stats?.growth.revenue || 0) >= 0;
  const collectionGrowthPositive = (stats?.growth.collection || 0) >= 0;

  return (
    <FeatureGate feature="finance">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Finance Overview
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Track your financial performance and metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finance/invoices"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            View All Invoices
          </Link>
          <Link
            href="/dashboard/finance/invoices"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
              <svg className="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-800 dark:text-white">
            {formatCurrency(stats?.totals.totalCollected || 0)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-sm font-medium ${collectionGrowthPositive ? "text-success-500" : "text-error-500"}`}>
              {collectionGrowthPositive ? "+" : ""}{stats?.growth.collection.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-500/10">
              <svg className="h-5 w-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-800 dark:text-white">
            {formatCurrency(stats?.totals.totalOutstanding || 0)}
          </p>
          <div className="mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stats?.invoiceStats.sent || 0} pending invoices
            </span>
          </div>
        </div>

        {/* Overdue */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/10">
              <svg className="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-error-500">
            {formatCurrency(stats?.totals.totalOverdue || 0)}
          </p>
          <div className="mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stats?.invoiceStats.overdue || 0} overdue invoices
            </span>
          </div>
        </div>

        {/* This Month */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-800 dark:text-white">
            {formatCurrency(stats?.thisMonth.collected || 0)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-sm font-medium ${revenueGrowthPositive ? "text-success-500" : "text-error-500"}`}>
              {revenueGrowthPositive ? "+" : ""}{stats?.growth.revenue.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Invoice Status Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Invoice Status
          </h3>
          <div className="space-y-4">
            {[
              { label: "Draft", count: stats?.invoiceStats.draft || 0, color: "bg-gray-400" },
              { label: "Pending", count: stats?.invoiceStats.sent || 0, color: "bg-brand-500" },
              { label: "Paid", count: stats?.invoiceStats.paid || 0, color: "bg-success-500" },
              { label: "Overdue", count: stats?.invoiceStats.overdue || 0, color: "bg-error-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-sm font-bold text-gray-800 dark:text-white">
                {stats?.invoiceStats.total || 0} invoices
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Monthly Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Invoiced</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {formatCurrency(stats?.thisMonth.invoiced || 0)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full"
                  style={{ width: `${Math.min(100, ((stats?.thisMonth.invoiced || 0) / Math.max(stats?.lastMonth.invoiced || 1, 1)) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Collected</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {formatCurrency(stats?.thisMonth.collected || 0)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success-500 rounded-full"
                  style={{ width: `${Math.min(100, ((stats?.thisMonth.collected || 0) / Math.max(stats?.thisMonth.invoiced || 1, 1)) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Expenses</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {formatCurrency(stats?.thisMonth.expenses || 0)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-error-500 rounded-full"
                  style={{ width: `${Math.min(100, ((stats?.thisMonth.expenses || 0) / Math.max(stats?.thisMonth.collected || 1, 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</span>
              <span className={`text-sm font-bold ${(stats?.thisMonth.netProfit || 0) >= 0 ? "text-success-500" : "text-error-500"}`}>
                {formatCurrency(stats?.thisMonth.netProfit || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Year to Date */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Year to Date
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Invoiced</span>
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {formatCurrency(stats?.yearToDate.invoiced || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Collected</span>
              <span className="text-sm font-medium text-success-500">
                {formatCurrency(stats?.yearToDate.collected || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</span>
              <span className="text-sm font-medium text-error-500">
                {formatCurrency(stats?.yearToDate.expenses || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Net Profit</span>
              <span className={`text-lg font-bold ${(stats?.yearToDate.netProfit || 0) >= 0 ? "text-success-500" : "text-error-500"}`}>
                {formatCurrency(stats?.yearToDate.netProfit || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Invoices
            </h3>
            <Link
              href="/dashboard/finance/invoices"
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              View all
            </Link>
          </div>
          {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice) => {
                const status = statusConfig[invoice.status] || statusConfig.draft;
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due {formatDate(invoice.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {formatCurrency(invoice.total || invoice.amount, invoice.currency)}
                      </span>
                      <Badge size="sm" color={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No invoices yet
            </p>
          )}
        </div>

        {/* Recent Payments */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Payments
            </h3>
            <Link
              href="/dashboard/finance/payments"
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              View all
            </Link>
          </div>
          {stats?.recentPayments && stats.recentPayments.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {payment.payment_method?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Payment"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(payment.payment_date)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-success-500">
                    +{formatCurrency(payment.amount, payment.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No payments recorded yet
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-brand-50 to-brand-100/50 p-6 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-brand-500/5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            href="/dashboard/finance/invoices"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
              <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Invoice</span>
          </Link>

          <Link
            href="/dashboard/finance/expenses"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20">
              <svg className="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Expense</span>
          </Link>

          <Link
            href="/dashboard/finance/payments"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
              <svg className="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Record Payment</span>
          </Link>

          <Link
            href="/dashboard/reports/financial"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-500/20">
              <svg className="h-5 w-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Reports</span>
          </Link>
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
