"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { FeatureGate } from "@/components/ui/FeatureGate";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────

interface Forecast {
  d30: number;
  d60: number;
  d90: number;
  total: number;
}

interface InvoiceItem {
  id: string;
  label: string;
  client: string;
  amount: number;
  weightedAmount: number;
  dueDate: string;
  probability: number;
  status: string;
  currency: string;
}

interface PipelineItem {
  id: string;
  label: string;
  company: string | null;
  amount: number;
  weightedAmount: number;
  probability: number;
  expectedClose: string;
  status: string;
  source: string;
}

interface ProposalItem {
  id: string;
  label: string;
  client: string;
  amount: number;
  weightedAmount: number;
  probability: number;
  validUntil: string | null;
  status: string;
  currency: string;
}

interface ContractItem {
  id: string;
  label: string;
  client: string;
  totalValue: number;
  monthlyRate: number;
  projectedRevenue: number;
  startDate: string | null;
  endDate: string | null;
  currency: string;
}

interface WeeklyPoint {
  week: string;
  weekStart: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulative: number;
}

interface MonthlyPoint {
  month: string;
  monthKey: string;
  revenue: number;
  expenses: number;
}

interface ForecastData {
  projections: {
    inflow: { d30: number; d60: number; d90: number };
    outflow: { d30: number; d60: number; d90: number };
    net: { d30: number; d60: number; d90: number };
  };
  sources: {
    invoices: { forecast: Forecast; count: number; items: InvoiceItem[] };
    pipeline: { forecast: Forecast; count: number; items: PipelineItem[] };
    proposals: { forecast: Forecast; count: number; items: ProposalItem[] };
    contracts: { forecast: Forecast; count: number; items: ContractItem[] };
    expenses: {
      forecast: Forecast;
      avgMonthly: number;
      byCategory: Record<string, number>;
    };
  };
  weeklyTimeline: WeeklyPoint[];
  monthlyRevenue: MonthlyPoint[];
}

// ─── Formatters ───────────────────────────────────────────────────────

function fmt(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

// ─── Stage badge ──────────────────────────────────────────────────────

const stageColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  qualification: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  proposal: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  viewed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  partially_paid: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

function StageBadge({ status }: { status: string }) {
  const cls = stageColors[status] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function RevenueForecasPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"invoices" | "pipeline" | "proposals" | "contracts" | "expenses">("invoices");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/forecasts/revenue");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forecast");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <FeatureGate feature="finance">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Revenue Forecast</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Loading projections...</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
                <div className="h-8 w-28 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
          <div className="animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-80" />
        </div>
      </FeatureGate>
    );
  }

  if (error || !data) {
    return (
      <FeatureGate feature="finance">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Revenue Forecast</h1>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-error-500">{error || "No data"}</p>
            <button onClick={fetchData} className="mt-2 text-sm text-brand-500 hover:text-brand-600">
              Try again
            </button>
          </div>
        </div>
      </FeatureGate>
    );
  }

  const { projections, sources, weeklyTimeline, monthlyRevenue } = data;

  // ─── Cash Flow Chart ──────────────────────────────────────────────
  const cashFlowOptions: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "Outfit, sans-serif",
      height: 340,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["#72b81a", "#ef4444", "#6366f1"],
    stroke: { curve: "smooth", width: [2.5, 2, 2] },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.3, opacityTo: 0.05 },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      labels: { colors: "#6B7280" },
      markers: { size: 6, shape: "circle" as const },
    },
    grid: {
      borderColor: "#e5e7eb",
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: weeklyTimeline.map((w) => w.week),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px", colors: "#9ca3af" } },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: ["#9ca3af"] },
        formatter: (val: number) => fmt(val, true),
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => fmt(val),
      },
    },
  };

  const cashFlowSeries = [
    { name: "Projected Inflow", data: weeklyTimeline.map((w) => w.inflow) },
    { name: "Projected Outflow", data: weeklyTimeline.map((w) => w.outflow) },
    { name: "Cumulative Net", data: weeklyTimeline.map((w) => w.cumulative) },
  ];

  // ─── Revenue Trend Chart (historical + projected months) ──────────
  const trendOptions: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      height: 280,
      toolbar: { show: false },
      stacked: false,
    },
    colors: ["#72b81a", "#ef4444"],
    plotOptions: {
      bar: { columnWidth: "50%", borderRadius: 4 },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      labels: { colors: "#6B7280" },
      markers: { size: 6, shape: "circle" as const },
    },
    grid: {
      borderColor: "#e5e7eb",
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: monthlyRevenue.map((m) => m.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px", colors: "#9ca3af" } },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: ["#9ca3af"] },
        formatter: (val: number) => fmt(val, true),
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => fmt(val),
      },
    },
  };

  const trendSeries = [
    { name: "Revenue", data: monthlyRevenue.map((m) => m.revenue) },
    { name: "Expenses", data: monthlyRevenue.map((m) => m.expenses) },
  ];

  // ─── Source breakdown ring ────────────────────────────────────────
  const sourceValues = [
    sources.invoices.forecast.total,
    sources.pipeline.forecast.total,
    sources.proposals.forecast.total,
    sources.contracts.forecast.total,
  ];
  const sourceLabels = ["Invoices", "Pipeline", "Proposals", "Contracts"];
  const sourceColors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

  const donutOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      height: 240,
    },
    colors: sourceColors,
    labels: sourceLabels,
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Forecast",
              fontSize: "12px",
              color: "#9ca3af",
              formatter: () => fmt(sourceValues.reduce((a, b) => a + b, 0), true),
            },
            value: {
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              formatter: (val: string) => fmt(parseFloat(val), true),
            },
          },
        },
      },
    },
    stroke: { width: 2 },
    tooltip: {
      y: { formatter: (val: number) => fmt(val) },
    },
  };

  // ─── Tab content renderers ────────────────────────────────────────

  function renderInvoicesTab() {
    const items = sources.invoices.items;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Invoice</th>
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Client</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">Outstanding</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">Weighted</th>
              <th className="py-2.5 pr-3 text-center font-medium text-gray-500 dark:text-gray-400">Due</th>
              <th className="py-2.5 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No outstanding invoices</td></tr>
            ) : items.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-gray-900 dark:text-white">{inv.label}</td>
                <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-400">{inv.client}</td>
                <td className="py-2.5 pr-3 text-right font-medium text-gray-900 dark:text-white">{fmt(inv.amount)}</td>
                <td className="py-2.5 pr-3 text-right text-gray-500 dark:text-gray-400">{fmt(inv.weightedAmount)}</td>
                <td className="py-2.5 pr-3 text-center text-gray-500 dark:text-gray-400">{fmtDate(inv.dueDate)}</td>
                <td className="py-2.5 text-center"><StageBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderPipelineTab() {
    const items = sources.pipeline.items;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Lead</th>
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Company</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">Deal Value</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">Weighted</th>
              <th className="py-2.5 pr-3 text-center font-medium text-gray-500 dark:text-gray-400">Prob.</th>
              <th className="py-2.5 pr-3 text-center font-medium text-gray-500 dark:text-gray-400">Close</th>
              <th className="py-2.5 text-center font-medium text-gray-500 dark:text-gray-400">Stage</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">No active pipeline deals</td></tr>
            ) : items.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-gray-900 dark:text-white">{lead.label}</td>
                <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-400">{lead.company || "-"}</td>
                <td className="py-2.5 pr-3 text-right font-medium text-gray-900 dark:text-white">{fmt(lead.amount)}</td>
                <td className="py-2.5 pr-3 text-right text-gray-500 dark:text-gray-400">{fmt(lead.weightedAmount)}</td>
                <td className="py-2.5 pr-3 text-center text-gray-500 dark:text-gray-400">{fmtPct(lead.probability)}</td>
                <td className="py-2.5 pr-3 text-center text-gray-500 dark:text-gray-400">{fmtDate(lead.expectedClose)}</td>
                <td className="py-2.5 text-center"><StageBadge status={lead.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderProposalsTab() {
    const items = sources.proposals.items;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Proposal</th>
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Client</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">Value</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">Weighted</th>
              <th className="py-2.5 pr-3 text-center font-medium text-gray-500 dark:text-gray-400">Valid Until</th>
              <th className="py-2.5 text-center font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No pending proposals</td></tr>
            ) : items.map((prop) => (
              <tr key={prop.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-gray-900 dark:text-white">{prop.label}</td>
                <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-400">{prop.client}</td>
                <td className="py-2.5 pr-3 text-right font-medium text-gray-900 dark:text-white">{fmt(prop.amount)}</td>
                <td className="py-2.5 pr-3 text-right text-gray-500 dark:text-gray-400">{fmt(prop.weightedAmount)}</td>
                <td className="py-2.5 pr-3 text-center text-gray-500 dark:text-gray-400">{fmtDate(prop.validUntil)}</td>
                <td className="py-2.5 text-center"><StageBadge status={prop.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderContractsTab() {
    const items = sources.contracts.items;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Contract</th>
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Client</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">Total Value</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">Monthly Rate</th>
              <th className="py-2.5 pr-3 text-right font-medium text-gray-500 dark:text-gray-400">90d Projected</th>
              <th className="py-2.5 text-center font-medium text-gray-500 dark:text-gray-400">Ends</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No active contracts</td></tr>
            ) : items.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-gray-900 dark:text-white">{c.label}</td>
                <td className="py-2.5 pr-3 text-gray-600 dark:text-gray-400">{c.client}</td>
                <td className="py-2.5 pr-3 text-right font-medium text-gray-900 dark:text-white">{fmt(c.totalValue)}</td>
                <td className="py-2.5 pr-3 text-right text-gray-500 dark:text-gray-400">{fmt(c.monthlyRate)}/mo</td>
                <td className="py-2.5 pr-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{fmt(c.projectedRevenue)}</td>
                <td className="py-2.5 text-center text-gray-500 dark:text-gray-400">{fmtDate(c.endDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderExpensesTab() {
    const { avgMonthly, byCategory } = sources.expenses;
    const sortedCategories = Object.entries(byCategory).sort(([, a], [, b]) => b - a);
    return (
      <div>
        <div className="mb-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Projections are based on your average monthly spend of{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{fmt(avgMonthly)}</span>
            {" "}over the last 6 months.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2.5 pr-3 text-left font-medium text-gray-500 dark:text-gray-400">Category</th>
              <th className="py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">Avg. Monthly</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.length === 0 ? (
              <tr><td colSpan={2} className="py-8 text-center text-gray-400">No expense data</td></tr>
            ) : sortedCategories.map(([cat, val]) => (
              <tr key={cat} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-gray-900 dark:text-white capitalize">
                  {cat.replace(/_/g, " ")}
                </td>
                <td className="py-2.5 text-right text-error-600 dark:text-error-400 font-medium">
                  {fmt(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const tabRenderers: Record<string, () => React.ReactNode> = {
    invoices: renderInvoicesTab,
    pipeline: renderPipelineTab,
    proposals: renderProposalsTab,
    contracts: renderContractsTab,
    expenses: renderExpensesTab,
  };

  const tabs = [
    { key: "invoices" as const, label: "Invoices", count: sources.invoices.count, color: "text-blue-600 dark:text-blue-400" },
    { key: "pipeline" as const, label: "Pipeline", count: sources.pipeline.count, color: "text-purple-600 dark:text-purple-400" },
    { key: "proposals" as const, label: "Proposals", count: sources.proposals.count, color: "text-amber-600 dark:text-amber-400" },
    { key: "contracts" as const, label: "Contracts", count: sources.contracts.count, color: "text-emerald-600 dark:text-emerald-400" },
    { key: "expenses" as const, label: "Expenses", count: 0, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <FeatureGate feature="finance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Revenue Forecast</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              30/60/90-day cash flow projections across all revenue sources
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              Refresh
            </button>
            <Link
              href="/dashboard/finance"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
            >
              Finance Overview
            </Link>
          </div>
        </div>

        {/* Projection Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "30-Day Net", value: projections.net.d30, inflow: projections.inflow.d30, outflow: projections.outflow.d30 },
            { label: "60-Day Net", value: projections.net.d60, inflow: projections.inflow.d60, outflow: projections.outflow.d60 },
            { label: "90-Day Net", value: projections.net.d90, inflow: projections.inflow.d90, outflow: projections.outflow.d90 },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {card.label}
              </p>
              <p className={`mt-2 text-3xl font-bold ${card.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {fmt(card.value)}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  In: {fmt(card.inflow, true)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  Out: {fmt(card.outflow, true)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Cash Flow Timeline (2 cols) */}
          <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
              12-Week Cash Flow Projection
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Weekly projected inflows, outflows, and cumulative net position
            </p>
            <ReactApexChart options={cashFlowOptions} series={cashFlowSeries} type="area" height={340} />
          </div>

          {/* Revenue Sources Donut (1 col) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
              Revenue Sources
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Weighted 90-day forecast by source
            </p>
            <ReactApexChart options={donutOptions} series={sourceValues} type="donut" height={240} />
            <div className="mt-4 space-y-2">
              {sourceLabels.map((label, i) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: sourceColors[i] }} />
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{fmt(sourceValues[i], true)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Trend */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
            Revenue vs. Expenses Trend
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Last 6 months of actual collections and expenditures
          </p>
          <ReactApexChart options={trendOptions} series={trendSeries} type="bar" height={280} />
        </div>

        {/* Source Breakdown Cards (30/60/90) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Invoice Collections", forecast: sources.invoices.forecast, count: sources.invoices.count, color: "bg-blue-500", icon: "M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" },
            { label: "Pipeline Deals", forecast: sources.pipeline.forecast, count: sources.pipeline.count, color: "bg-purple-500", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" },
            { label: "Proposals", forecast: sources.proposals.forecast, count: sources.proposals.count, color: "bg-amber-500", icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
            { label: "Contracts (MRR)", forecast: sources.contracts.forecast, count: sources.contracts.count, color: "bg-emerald-500", icon: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}/10`}>
                  <svg className={`h-5 w-5 ${card.color.replace("bg-", "text-")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{card.label}</p>
                  <p className="text-[11px] text-gray-400">{card.count} active</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "30 days", value: card.forecast.d30 },
                  { label: "60 days", value: card.forecast.d60 },
                  { label: "90 days", value: card.forecast.d90 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{fmt(row.value, true)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-1.5 mt-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Total</span>
                  <span className="font-bold text-gray-900 dark:text-white">{fmt(card.forecast.total, true)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Drill-Down Table with Tabs */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 dark:border-gray-700 px-5 pt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
              Forecast Details
            </h3>
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      activeTab === tab.key ? tab.color : "text-gray-400 dark:text-gray-500"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            {tabRenderers[activeTab]()}
          </div>
        </div>

        {/* Methodology Note */}
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            <strong className="text-gray-700 dark:text-gray-300">How projections are calculated:</strong>{" "}
            Invoice collections are weighted by status (85% for pending, 70% for overdue, 90% for partially paid).
            Pipeline deals use your assigned probability. Proposals are weighted at 40% (sent) / 55% (viewed).
            Contract revenue is prorated monthly over the contract duration. Expense projections use your 6-month historical average.
          </p>
        </div>
      </div>
    </FeatureGate>
  );
}
