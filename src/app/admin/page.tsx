"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalClients: number;
  activeClients: number;
  totalInvoices: number;
  paidInvoices: number;
  mrr: number;
  totalInvoiced: number;
  totalPaid: number;
  newTenantsThisMonth: number;
  newUsersThisMonth: number;
  tenantGrowthPercent: number;
  userGrowthPercent: number;
  avgUsersPerTenant: number;
  avgProjectsPerTenant: number;
  conversionRate: number;
  taskCompletionRate: number;
}

interface WeeklyActivity {
  projects: number;
  tasks: number;
  invoices: number;
}

interface ChartData {
  months: string[];
  tenantGrowth: number[];
  userGrowth: number[];
  planDistribution: {
    free: number;
    starter: number;
    professional: number;
    business: number;
  };
}

interface TopTenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  users: number;
  projects: number;
}

interface RecentTenant {
  id: string;
  name: string;
  subdomain: string;
  created_at: string;
  status: string;
  plan: string;
}

interface RecentUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  tenant_name: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [topTenants, setTopTenants] = useState<TopTenant[]>([]);
  const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (data.error) {
        console.error("Error fetching stats:", data.error);
        return;
      }

      setStats(data.stats);
      setWeeklyActivity(data.weeklyActivity);
      setCharts(data.charts);
      setTopTenants(data.topTenants || []);
      setRecentTenants(data.recentTenants || []);
      setRecentUsers(data.recentUsers || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
      starter: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      professional: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      business: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    };
    return colors[plan?.toLowerCase()] || colors.free;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const growthChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#6366f1", "#10b981"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    xaxis: {
      categories: charts?.months || [],
      labels: {
        style: { colors: "#9ca3af", fontSize: "12px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#9ca3af", fontSize: "12px" },
      },
    },
    grid: {
      borderColor: "#374151",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: { colors: "#9ca3af" },
    },
    tooltip: {
      theme: "dark",
    },
    dataLabels: { enabled: false },
  };

  const growthChartSeries = [
    { name: "Tenants", data: charts?.tenantGrowth || [] },
    { name: "Users", data: charts?.userGrowth || [] },
  ];

  const planChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#6b7280", "#3b82f6", "#8b5cf6", "#f59e0b"],
    labels: ["Free", "Starter", "Professional", "Business"],
    legend: {
      position: "bottom",
      labels: { colors: "#9ca3af" },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              color: "#9ca3af",
              formatter: () => String(stats?.totalTenants || 0),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark" },
  };

  const planChartSeries = charts
    ? [
        charts.planDistribution.free,
        charts.planDistribution.starter,
        charts.planDistribution.professional,
        charts.planDistribution.business,
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Overview
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Monitor your platform&apos;s health and growth
        </p>
      </div>

      {/* Top Stats Row - Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Tenants
            </div>
            <p className="mt-2 text-3xl font-bold">{stats?.totalTenants || 0}</p>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={`flex items-center gap-1 ${(stats?.tenantGrowthPercent || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {(stats?.tenantGrowthPercent || 0) >= 0 ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(stats?.tenantGrowthPercent || 0)}%
              </span>
              <span className="text-indigo-200">vs last month</span>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-100 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Users
            </div>
            <p className="mt-2 text-3xl font-bold">{stats?.totalUsers || 0}</p>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={`flex items-center gap-1 ${(stats?.userGrowthPercent || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {(stats?.userGrowthPercent || 0) >= 0 ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(stats?.userGrowthPercent || 0)}%
              </span>
              <span className="text-emerald-200">vs last month</span>
            </div>
          </div>
        </div>

        {/* MRR */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-violet-100 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              MRR
            </div>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(stats?.mrr || 0)}</p>
            <p className="mt-1 text-sm text-violet-200">
              {stats?.conversionRate || 0}% conversion rate
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-100 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
              </svg>
              Total Invoiced
            </div>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(stats?.totalInvoiced || 0)}</p>
            <p className="mt-1 text-sm text-amber-200">
              {formatCurrency(stats?.totalPaid || 0)} collected
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalProjects || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalTasks || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalClients || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clients</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalInvoices || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Invoices</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.avgUsersPerTenant || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Users/Tenant</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.taskCompletionRate || 0}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Task Completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Week&apos;s Activity</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyActivity?.projects || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">New Projects</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyActivity?.tasks || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">New Tasks</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyActivity?.invoices || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">New Invoices</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Growth Overview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tenant and user signups over the last 6 months</p>
            </div>
          </div>
          <div className="h-72">
            {typeof window !== "undefined" && charts && (
              <Chart
                options={growthChartOptions}
                series={growthChartSeries}
                type="area"
                height="100%"
              />
            )}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plan Distribution</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tenants by subscription plan</p>
          </div>
          <div className="h-72">
            {typeof window !== "undefined" && charts && (
              <Chart
                options={planChartOptions}
                series={planChartSeries}
                type="donut"
                height="100%"
              />
            )}
          </div>
        </div>
      </div>

      {/* Top Tenants & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Tenants */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Tenants</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">By activity level</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {topTenants.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No tenants yet
              </div>
            ) : (
              topTenants.map((tenant, idx) => (
                <div key={tenant.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{tenant.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.subdomain}.1i1.ae</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tenant.users} users</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.projects} projects</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Tenants</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latest signups</p>
            </div>
            <a
              href="/admin/tenants"
              className="text-sm font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {recentTenants.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No tenants yet
              </div>
            ) : (
              recentTenants.map((tenant) => (
                <div key={tenant.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{tenant.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.subdomain}.1i1.ae</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPlanColor(tenant.plan)}`}>
                      {tenant.plan || "Free"}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(tenant.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Users</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latest signups</p>
            </div>
            <a
              href="/admin/users"
              className="text-sm font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7-7 7" />
              </svg>
            </a>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {recentUsers.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No users yet
              </div>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {user.full_name || "Unnamed User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 dark:text-gray-300">{user.tenant_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
