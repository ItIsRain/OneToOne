"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GroupIcon,
  CalenderIcon,
  DollarLineIcon,
  TaskIcon,
} from "@/icons";

interface DashboardMetricsData {
  activeClients: number;
  clientsGrowth: number;
  upcomingEvents: number;
  eventsThisWeek: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  pendingTasks: number;
  overdueTasks: number;
  activeProjects: number;
  avgProjectProgress: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  teamMembers: number;
}

interface DashboardMetricsProps {
  onDataLoaded?: (data: DashboardMetricsData) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ onDataLoaded }) => {
  const [metrics, setMetrics] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");

      if (!res.ok) {
        if (res.status === 401 || res.headers.get("content-type")?.includes("text/html")) {
          throw new Error("Session expired. Please refresh the page.");
        }
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error || "Failed to fetch metrics");
      }

      const data = await res.json();

      setMetrics(data.metrics);
      if (onDataLoaded) {
        onDataLoaded(data.metrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [onDataLoaded]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse"
          >
            <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="mt-5 space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
        <p className="text-error-600 dark:text-error-400">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-2 text-sm text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Active Clients */}
      <div className="rounded-2xl border border-gray-200 border-l-4 border-l-brand-500 bg-white p-5 dark:border-gray-800 dark:border-l-brand-500 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600">
          <GroupIcon className="text-white size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active Clients
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.activeClients}
            </h4>
          </div>
          <Badge color={metrics.clientsGrowth > 0 ? "success" : "light"}>
            {metrics.clientsGrowth > 0 && <ArrowUpIcon />}
            +{metrics.clientsGrowth} this month
          </Badge>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="rounded-2xl border border-gray-200 border-l-4 border-l-warning-500 bg-white p-5 dark:border-gray-800 dark:border-l-warning-500 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-warning-400 to-warning-600">
          <CalenderIcon className="text-white size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Upcoming Events
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.upcomingEvents}
            </h4>
          </div>
          <Badge color="warning">
            <ArrowUpIcon />
            {metrics.eventsThisWeek} this week
          </Badge>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="rounded-2xl border border-gray-200 border-l-4 border-l-success-500 bg-white p-5 dark:border-gray-800 dark:border-l-success-500 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-success-400 to-success-600">
          <DollarLineIcon className="text-white size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Monthly Revenue
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatCurrency(metrics.monthlyRevenue)}
            </h4>
          </div>
          <Badge color={metrics.revenueGrowth >= 0 ? "success" : "error"}>
            {metrics.revenueGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon className="text-error-500" />}
            {Math.abs(metrics.revenueGrowth)}%
          </Badge>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="rounded-2xl border border-gray-200 border-l-4 border-l-blue-500 bg-white p-5 dark:border-gray-800 dark:border-l-blue-500 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600">
          <TaskIcon className="text-white size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Pending Tasks
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metrics.pendingTasks}
            </h4>
          </div>
          <Badge color={metrics.overdueTasks > 0 ? "error" : "success"}>
            {metrics.overdueTasks > 0 && <ArrowDownIcon className="text-error-500" />}
            {metrics.overdueTasks} overdue
          </Badge>
        </div>
      </div>
    </div>
  );
};
