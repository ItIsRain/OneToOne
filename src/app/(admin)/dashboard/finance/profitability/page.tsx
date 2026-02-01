"use client";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { FeatureGate } from "@/components/ui/FeatureGate";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────
interface ProjectProfit {
  id: string;
  name: string;
  project_code: string | null;
  status: string;
  billing_type: string;
  currency: string;
  client_name: string | null;
  client_company: string | null;
  budget: number | null;
  estimated_hours: number;
  start_date: string | null;
  end_date: string | null;
  revenue: number;
  revenue_paid: number;
  invoice_count: number;
  labor_cost: number;
  labor_hours: number;
  billable_hours: number;
  time_entry_count: number;
  expense_cost: number;
  billable_expenses: number;
  expense_count: number;
  expense_categories: Record<string, number>;
  total_cost: number;
  profit: number;
  margin: number;
  labor_percent: number;
  expense_percent: number;
  budget_used_percent: number | null;
}

interface ClientProfit {
  name: string;
  company: string | null;
  revenue: number;
  cost: number;
  profit: number;
  projects: number;
  margin: number;
}

interface Summary {
  project_count: number;
  projects_with_revenue: number;
  total_revenue: number;
  total_labor_cost: number;
  total_expense_cost: number;
  total_cost: number;
  total_profit: number;
  overall_margin: number;
  avg_margin: number;
  negative_margin_count: number;
  low_margin_count: number;
}

interface ProfitabilityData {
  projects: ProjectProfit[];
  clients: ClientProfit[];
  summary: Summary;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function marginColor(margin: number): string {
  if (margin < 0) return "text-red-500";
  if (margin < 20) return "text-amber-500";
  if (margin < 50) return "text-emerald-500";
  return "text-emerald-600 dark:text-emerald-400";
}

function marginBg(margin: number): string {
  if (margin < 0) return "bg-red-50 dark:bg-red-900/20";
  if (margin < 20) return "bg-amber-50 dark:bg-amber-900/20";
  return "bg-emerald-50 dark:bg-emerald-900/20";
}

function statusBadge(status: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    planning: { label: "Planning", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    active: { label: "Active", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    on_hold: { label: "On Hold", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  };
  return map[status] || { label: status, cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ProfitabilityPage() {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"projects" | "clients">("projects");
  const [sortKey, setSortKey] = useState<"profit" | "margin" | "revenue" | "name">("profit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/profitability");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profitability data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (loading) {
    return (
      <FeatureGate feature="finance">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </FeatureGate>
    );
  }

  if (error) {
    return (
      <FeatureGate feature="finance">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-error-500">{error}</p>
          <button onClick={fetchData} className="mt-2 text-brand-500 hover:text-brand-600">Try again</button>
        </div>
      </FeatureGate>
    );
  }

  if (!data || data.projects.length === 0) {
    return (
      <FeatureGate feature="finance">
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No project data yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create projects and add invoices, time entries, or expenses to see profitability.</p>
        </div>
      </FeatureGate>
    );
  }

  const { projects, clients, summary } = data;

  // Filter projects
  const filtered = statusFilter === "all" ? projects : projects.filter((p) => p.status === statusFilter);

  // Sort projects
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "desc" ? -1 : 1;
    if (sortKey === "name") return dir * a.name.localeCompare(b.name);
    return dir * ((a[sortKey] || 0) - (b[sortKey] || 0));
  });

  // Chart data: top 10 projects by revenue
  const topByRevenue = [...projects].filter((p) => p.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const barChartOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", stacked: true, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "65%" } },
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    xaxis: {
      categories: topByRevenue.map((p) => p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name),
      labels: { formatter: (val: string) => formatCurrency(Number(val)) },
    },
    yaxis: { labels: { style: { fontSize: "12px" } } },
    legend: { position: "top", horizontalAlign: "left" },
    tooltip: { y: { formatter: (val: number) => formatCurrency(val) } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#e5e7eb", strokeDashArray: 4 },
    theme: { mode: typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light" },
  };

  const barChartSeries = [
    { name: "Profit", data: topByRevenue.map((p) => Math.max(p.profit, 0)) },
    { name: "Labor Cost", data: topByRevenue.map((p) => p.labor_cost) },
    { name: "Expenses", data: topByRevenue.map((p) => p.expense_cost) },
  ];

  // Margin distribution donut
  const marginBuckets = {
    negative: projects.filter((p) => p.revenue > 0 && p.margin < 0).length,
    low: projects.filter((p) => p.revenue > 0 && p.margin >= 0 && p.margin < 20).length,
    moderate: projects.filter((p) => p.revenue > 0 && p.margin >= 20 && p.margin < 50).length,
    healthy: projects.filter((p) => p.revenue > 0 && p.margin >= 50).length,
    noRevenue: projects.filter((p) => p.revenue === 0).length,
  };

  const donutOptions: ApexCharts.ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: ["Negative (<0%)", "Low (0–20%)", "Moderate (20–50%)", "Healthy (50%+)", "No Revenue"],
    colors: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#d1d5db"],
    legend: { position: "bottom", fontSize: "12px" },
    plotOptions: { pie: { donut: { size: "60%", labels: { show: true, total: { show: true, label: "Projects", fontSize: "14px" } } } } },
    dataLabels: { enabled: false },
    theme: { mode: typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light" },
  };

  const donutSeries = [marginBuckets.negative, marginBuckets.low, marginBuckets.moderate, marginBuckets.healthy, marginBuckets.noRevenue];

  const uniqueStatuses = [...new Set(projects.map((p) => p.status))];

  return (
    <FeatureGate feature="finance">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Project Profitability</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Revenue, costs, and margins across all projects</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <SummaryCard label="Total Revenue" value={formatCurrency(summary.total_revenue)} color="text-gray-900 dark:text-white" />
          <SummaryCard label="Total Cost" value={formatCurrency(summary.total_cost)} sub={`Labor: ${formatCurrency(summary.total_labor_cost)} | Expenses: ${formatCurrency(summary.total_expense_cost)}`} color="text-gray-900 dark:text-white" />
          <SummaryCard
            label="Net Profit"
            value={formatCurrency(summary.total_profit)}
            color={summary.total_profit >= 0 ? "text-emerald-500" : "text-red-500"}
          />
          <SummaryCard
            label="Overall Margin"
            value={`${summary.overall_margin}%`}
            sub={`Avg: ${summary.avg_margin}%`}
            color={marginColor(summary.overall_margin)}
          />
          <SummaryCard
            label="At Risk"
            value={`${summary.negative_margin_count + summary.low_margin_count}`}
            sub={`${summary.negative_margin_count} losing money, ${summary.low_margin_count} low margin`}
            color={summary.negative_margin_count > 0 ? "text-red-500" : "text-amber-500"}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Cost breakdown bar chart */}
          <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Projects — Revenue Breakdown</h3>
            {topByRevenue.length > 0 ? (
              <ReactApexChart options={barChartOptions} series={barChartSeries} type="bar" height={Math.max(300, topByRevenue.length * 45)} />
            ) : (
              <p className="text-sm text-gray-400 py-12 text-center">No revenue data to display</p>
            )}
          </div>

          {/* Margin distribution donut */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Margin Distribution</h3>
            <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={300} />
          </div>
        </div>

        {/* View toggle + filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("projects")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                view === "projects"
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              By Project
            </button>
            <button
              onClick={() => setView("clients")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                view === "clients"
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              By Client
            </button>
          </div>

          {view === "projects" && (
            <div className="flex items-center gap-2 flex-wrap">
              {["all", ...uniqueStatuses].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    statusFilter === s
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project table */}
        {view === "projects" && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <SortHeader label="Project" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} className="w-56" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <SortHeader label="Revenue" sortKey="revenue" current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                    <SortHeader label="Profit" sortKey="profit" current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                    <SortHeader label="Margin" sortKey="margin" current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hours</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sorted.map((p) => {
                    const isExpanded = expandedId === p.id;
                    const badge = statusBadge(p.status);
                    return (
                      <React.Fragment key={p.id}>
                        <tr className={`transition-colors ${isExpanded ? "bg-gray-50 dark:bg-gray-800/40" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/20"}`}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{p.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {p.client_name || "No client"}{p.project_code ? ` · ${p.project_code}` : ""}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-800 dark:text-white">
                            {p.revenue > 0 ? formatCurrency(p.revenue, p.currency) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                            {p.total_cost > 0 ? formatCurrency(p.total_cost, p.currency) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-semibold ${p.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                              {p.revenue > 0 || p.total_cost > 0 ? formatCurrency(p.profit, p.currency) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.revenue > 0 ? (
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${marginBg(p.margin)} ${marginColor(p.margin)}`}>
                                {p.margin}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                            {p.labor_hours > 0 ? `${p.labor_hours}h` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : p.id)}
                              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <svg className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Expanded drill-down */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 bg-gray-50/80 dark:bg-gray-800/30">
                              <ProjectDrillDown project={p} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Client table */}
        {view === "clients" && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-56">Client</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Projects</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Profit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {clients.map((c) => (
                    <tr key={c.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{c.name}</p>
                        {c.company && <p className="text-xs text-gray-400">{c.company}</p>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">{c.projects}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-800 dark:text-white">
                        {c.revenue > 0 ? formatCurrency(c.revenue) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {c.cost > 0 ? formatCurrency(c.cost) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${c.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                          {c.revenue > 0 || c.cost > 0 ? formatCurrency(c.profit) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.revenue > 0 ? (
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${marginBg(c.margin)} ${marginColor(c.margin)}`}>
                            {c.margin}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          <p>
            Revenue = invoiced amounts (excluding drafts, cancelled, refunded). Labor cost = time logged x team member hourly rate.
            Margin = (Revenue - Total Cost) / Revenue. Projects with no revenue show no margin.
          </p>
        </div>
      </div>
    </FeatureGate>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  sortKey: string;
  current: string;
  dir: string;
  onSort: (key: "profit" | "margin" | "revenue" | "name") => void;
  align?: "left" | "right";
  className?: string;
}) {
  const isActive = current === sortKey;
  return (
    <th className={`px-4 py-3 text-${align} ${className}`}>
      <button
        onClick={() => onSort(sortKey as "profit" | "margin" | "revenue" | "name")}
        className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
          isActive ? "text-brand-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
        }`}
      >
        {label}
        {isActive && (
          <span className="ml-1">{dir === "desc" ? "↓" : "↑"}</span>
        )}
      </button>
    </th>
  );
}

function ProjectDrillDown({ project: p }: { project: ProjectProfit }) {
  const categories = Object.entries(p.expense_categories || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* Cost breakdown */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DrillStat label="Revenue" value={formatCurrency(p.revenue, p.currency)} sub={`${p.invoice_count} invoice${p.invoice_count !== 1 ? "s" : ""} · ${formatCurrency(p.revenue_paid, p.currency)} collected`} />
        <DrillStat label="Labor Cost" value={formatCurrency(p.labor_cost, p.currency)} sub={`${p.labor_hours}h logged (${p.billable_hours}h billable)`} />
        <DrillStat label="Expenses" value={formatCurrency(p.expense_cost, p.currency)} sub={`${p.expense_count} expense${p.expense_count !== 1 ? "s" : ""}`} />
        <DrillStat
          label="Budget Status"
          value={p.budget ? formatCurrency(p.budget, p.currency) : "No budget"}
          sub={p.budget_used_percent !== null ? `${p.budget_used_percent}% used` : undefined}
          color={p.budget_used_percent !== null && p.budget_used_percent > 100 ? "text-red-500" : undefined}
        />
      </div>

      {/* Margin bar */}
      {p.revenue > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Cost breakdown of revenue</span>
            <span>{p.margin}% profit margin</span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            {p.labor_percent > 0 && (
              <div
                className="bg-amber-400 dark:bg-amber-600 transition-all"
                style={{ width: `${Math.min(p.labor_percent, 100)}%` }}
                title={`Labor: ${p.labor_percent}%`}
              />
            )}
            {p.expense_percent > 0 && (
              <div
                className="bg-red-400 dark:bg-red-600 transition-all"
                style={{ width: `${Math.min(p.expense_percent, 100 - p.labor_percent)}%` }}
                title={`Expenses: ${p.expense_percent}%`}
              />
            )}
            {p.margin > 0 && (
              <div
                className="bg-emerald-400 dark:bg-emerald-600 transition-all"
                style={{ width: `${Math.min(p.margin, 100 - p.labor_percent - p.expense_percent)}%` }}
                title={`Profit: ${p.margin}%`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-amber-400" /> Labor {p.labor_percent}%</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-red-400" /> Expenses {p.expense_percent}%</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-emerald-400" /> Profit {p.margin}%</span>
          </div>
        </div>
      )}

      {/* Expense categories */}
      {categories.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Expense Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(([cat, amount]) => (
              <span key={cat} className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
                {cat}: {formatCurrency(amount, p.currency)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DrillStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-base font-bold ${color || "text-gray-900 dark:text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}
