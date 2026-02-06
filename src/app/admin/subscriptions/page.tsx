"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Subscription {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_subdomain: string;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  has_stripe: boolean;
  subscription_type: "free" | "trial" | "paid" | "expired" | "granted";
  granted_by: string | null;
  granted_at: string | null;
  grant_reason: string | null;
}

interface PlanStats {
  free: number;
  starter: number;
  professional: number;
  business: number;
}

interface TrialStats {
  trial: number;
  paid: number;
  granted: number;
  expired: number;
}

interface Revenue {
  actualMRR: number;
  potentialMRR: number;
  totalMRR: number;
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 29,
  professional: 79,
  business: 199,
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats>({ free: 0, starter: 0, professional: 0, business: 0 });
  const [trialStats, setTrialStats] = useState<TrialStats>({ trial: 0, paid: 0, granted: 0, expired: 0 });
  const [revenue, setRevenue] = useState<Revenue>({ actualMRR: 0, potentialMRR: 0, totalMRR: 0 });
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Grant modal state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantTenant, setGrantTenant] = useState<Subscription | null>(null);
  const [grantPlan, setGrantPlan] = useState("professional");
  const [grantDays, setGrantDays] = useState(30);
  const [grantReason, setGrantReason] = useState("");
  const [granting, setGranting] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/subscriptions");
      const data = await response.json();

      if (data.error) {
        console.error("Error fetching subscriptions:", data.error);
        return;
      }

      setPlanStats(data.planStats);
      setTrialStats(data.trialStats || { trial: 0, paid: 0, granted: 0, expired: 0 });
      setRevenue(data.revenue || { actualMRR: 0, potentialMRR: 0, totalMRR: 0 });
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const updatePlan = async (tenantId: string, newPlan: string) => {
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenantId, plan: newPlan }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      fetchSubscriptions();
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Failed to update plan");
    }
  };

  const grantSubscription = async () => {
    if (!grantTenant) return;

    setGranting(true);
    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: grantTenant.tenant_id,
          plan: grantPlan,
          days: grantDays,
          reason: grantReason || undefined,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      alert(`Successfully granted ${grantDays} days of ${grantPlan} to ${grantTenant.tenant_name}`);
      setShowGrantModal(false);
      setGrantTenant(null);
      setGrantPlan("professional");
      setGrantDays(30);
      setGrantReason("");
      fetchSubscriptions();
    } catch (error) {
      console.error("Error granting subscription:", error);
      alert("Failed to grant subscription");
    } finally {
      setGranting(false);
    }
  };

  const openGrantModal = (sub: Subscription) => {
    setGrantTenant(sub);
    setGrantPlan(sub.plan === "free" ? "professional" : sub.plan);
    setShowGrantModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Apply filters
  let filteredSubscriptions = subscriptions;
  if (planFilter !== "all") {
    filteredSubscriptions = filteredSubscriptions.filter((sub) => sub.plan.toLowerCase() === planFilter);
  }
  if (typeFilter !== "all") {
    filteredSubscriptions = filteredSubscriptions.filter((sub) => sub.subscription_type === typeFilter);
  }

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
      starter: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      professional: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      business: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    };
    return colors[plan?.toLowerCase()] || colors.free;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
      trial: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
      paid: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      granted: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
      expired: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };
    return colors[type] || colors.free;
  };

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#9ca3af", "#3b82f6", "#8b5cf6", "#f59e0b"],
    labels: ["Free", "Starter", "Professional", "Business"],
    legend: {
      position: "bottom",
      labels: { colors: "#6b7280" },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              color: "#6b7280",
              formatter: () => String(subscriptions.length),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark" },
  };

  const chartSeries = [
    planStats.free,
    planStats.starter,
    planStats.professional,
    planStats.business,
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage tenant plans and billing
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Actual MRR */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-100 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Actual MRR (Paid)
            </div>
            <p className="mt-2 text-3xl font-bold">${revenue.actualMRR.toLocaleString()}</p>
            <p className="mt-1 text-sm text-emerald-100">
              {trialStats.paid} paying customers
            </p>
          </div>
        </div>

        {/* Potential MRR (Trials) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-yellow-100 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Potential MRR (Trials)
            </div>
            <p className="mt-2 text-3xl font-bold">${revenue.potentialMRR.toLocaleString()}</p>
            <p className="mt-1 text-sm text-yellow-100">
              {trialStats.trial} on trial
            </p>
          </div>
        </div>

        {/* Granted */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Admin Granted
            </div>
            <p className="mt-2 text-3xl font-bold">{trialStats.granted}</p>
            <p className="mt-1 text-sm text-indigo-100">
              subscriptions granted
            </p>
          </div>
        </div>

        {/* Expired */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-200 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Expired Trials
            </div>
            <p className="mt-2 text-3xl font-bold">{trialStats.expired}</p>
            <p className="mt-1 text-sm text-gray-200">
              need attention
            </p>
          </div>
        </div>
      </div>

      {/* Plan Distribution Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Plan Distribution</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Breakdown by subscription plan</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-48 h-48">
            {typeof window !== "undefined" && (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="donut"
                height="100%"
              />
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {[
              { name: "Free", count: planStats.free, price: 0, color: "bg-gray-400" },
              { name: "Starter", count: planStats.starter, price: 29, color: "bg-blue-500" },
              { name: "Professional", count: planStats.professional, price: 79, color: "bg-purple-500" },
              { name: "Business", count: planStats.business, price: 199, color: "bg-amber-500" },
            ].map((plan) => (
              <div key={plan.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {plan.count} tenants · ${plan.price}/mo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Plan Filter */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Plan</p>
            <div className="flex flex-wrap gap-2">
              {["all", "free", "starter", "professional", "business"].map((plan) => (
                <button
                  key={plan}
                  onClick={() => setPlanFilter(plan)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    planFilter === plan
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />

          {/* Type Filter */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Status</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "trial", label: "Trial" },
                { key: "paid", label: "Paid" },
                { key: "granted", label: "Granted" },
                { key: "expired", label: "Expired" },
              ].map((type) => (
                <button
                  key={type.key}
                  onClick={() => setTypeFilter(type.key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    typeFilter === type.key
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredSubscriptions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No subscriptions found</h3>
          <p className="text-gray-500 dark:text-gray-400">No tenants match the selected filters</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expires / Renews
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredSubscriptions.map((sub) => {
                  const daysRemaining = getDaysRemaining(sub.trial_ends_at || sub.current_period_end);

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {sub.tenant_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{sub.tenant_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {sub.tenant_subdomain}.1i1.ae
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPlanColor(sub.plan)}`}>
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(sub.subscription_type)}`}>
                          {sub.subscription_type === "paid" && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {sub.subscription_type === "trial" && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {sub.subscription_type === "granted" && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                          )}
                          {sub.subscription_type.charAt(0).toUpperCase() + sub.subscription_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {sub.subscription_type === "free" ? (
                          <span className="text-sm text-gray-400">-</span>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {sub.trial_ends_at ? formatDate(sub.trial_ends_at) : (sub.current_period_end ? formatDate(sub.current_period_end) : "-")}
                            </p>
                            {daysRemaining !== null && (
                              <p className={`text-xs ${daysRemaining <= 7 ? "text-red-500" : daysRemaining <= 14 ? "text-yellow-500" : "text-gray-400"}`}>
                                {daysRemaining > 0 ? `${daysRemaining} days left` : "Expired"}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white font-medium">
                          ${PLAN_PRICES[sub.plan.toLowerCase()] || 0}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">/mo</span>
                        {sub.subscription_type === "trial" && (
                          <span className="ml-1 text-xs text-yellow-500">(not billed)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openGrantModal(sub)}
                            className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          >
                            Grant
                          </button>
                          <select
                            value={sub.plan}
                            onChange={(e) => updatePlan(sub.tenant_id, e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
                          >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="professional">Professional</option>
                            <option value="business">Business</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grant Modal */}
      {showGrantModal && grantTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGrantModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grant Subscription</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{grantTenant.tenant_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plan</label>
                  <select
                    value={grantPlan}
                    onChange={(e) => setGrantPlan(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="starter">Starter ($29/mo value)</option>
                    <option value="professional">Professional ($79/mo value)</option>
                    <option value="business">Business ($199/mo value)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (days)</label>
                  <div className="flex gap-2">
                    {[7, 14, 30, 60, 90].map((days) => (
                      <button
                        key={days}
                        onClick={() => setGrantDays(days)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          grantDays === days
                            ? "bg-brand-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={grantDays}
                    onChange={(e) => setGrantDays(Math.min(365, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="mt-2 w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="Custom days (1-365)"
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason (optional)</label>
                  <textarea
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                    rows={2}
                    placeholder="e.g., Beta tester, Partnership, Demo account..."
                  />
                </div>

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This will grant <strong>{grantTenant.tenant_name}</strong> access to <strong>{grantPlan}</strong> features for <strong>{grantDays} days</strong> starting now.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowGrantModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={grantSubscription}
                  disabled={granting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {granting ? "Granting..." : "Grant Subscription"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
