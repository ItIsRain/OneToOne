"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";
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
  // Optional: pre-loaded data from parent (combined endpoint)
  data?: DashboardMetricsData | null;
  isLoading?: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const animated = useCountUp(value, 1200, decimals);
  const formatted = decimals > 0
    ? animated.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : animated.toLocaleString("en-US");
  return <>{prefix}{formatted}{suffix}</>;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ onDataLoaded, data: propData, isLoading: propLoading }) => {
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState(propData === undefined);
  const [error, setError] = useState("");

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use prop data if available
  const effectiveMetrics = propData || metrics;
  const effectiveLoading = propLoading !== undefined ? propLoading : loading;

  const fetchMetrics = useCallback(async () => {
    // Skip fetch if data is provided via props
    if (propData !== undefined) return;

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
  }, [onDataLoaded, propData]);

  useEffect(() => {
    // Only fetch if no prop data provided
    if (propData === undefined) {
      fetchMetrics();
    }
  }, [fetchMetrics, propData]);

  // Show skeleton during SSR and loading to prevent hydration mismatch
  if (!mounted || effectiveLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-8 w-20 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
            <div className="h-4 w-28 bg-gray-50 dark:bg-gray-800/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error && !effectiveMetrics) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
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

  if (!effectiveMetrics) return null;

  const cards = [
    {
      label: "Active Clients",
      value: effectiveMetrics.activeClients,
      icon: <GroupIcon className="size-5" />,
      iconBg: "bg-brand-100 dark:bg-brand-500/15",
      iconColor: "text-brand-600 dark:text-brand-400",
      badge: (
        <Badge color={effectiveMetrics.clientsGrowth > 0 ? "success" : "light"}>
          {effectiveMetrics.clientsGrowth > 0 && <ArrowUpIcon />}
          +{effectiveMetrics.clientsGrowth} this month
        </Badge>
      ),
    },
    {
      label: "Upcoming Events",
      value: effectiveMetrics.upcomingEvents,
      icon: <CalenderIcon className="size-5" />,
      iconBg: "bg-amber-100 dark:bg-amber-500/15",
      iconColor: "text-amber-600 dark:text-amber-400",
      badge: (
        <Badge color="warning">
          <ArrowUpIcon />
          {effectiveMetrics.eventsThisWeek} this week
        </Badge>
      ),
    },
    {
      label: "Monthly Revenue",
      value: effectiveMetrics.monthlyRevenue,
      prefix: "$",
      decimals: 2,
      icon: <DollarLineIcon className="size-5" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badge: (
        <Badge color={effectiveMetrics.revenueGrowth >= 0 ? "success" : "error"}>
          {effectiveMetrics.revenueGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon className="text-error-500" />}
          {Math.abs(effectiveMetrics.revenueGrowth)}%
        </Badge>
      ),
    },
    {
      label: "Pending Tasks",
      value: effectiveMetrics.pendingTasks,
      icon: <TaskIcon className="size-5" />,
      iconBg: "bg-blue-100 dark:bg-blue-500/15",
      iconColor: "text-blue-600 dark:text-blue-400",
      badge: (
        <Badge color={effectiveMetrics.overdueTasks > 0 ? "error" : "success"}>
          {effectiveMetrics.overdueTasks > 0 && <ArrowDownIcon className="text-error-500" />}
          {effectiveMetrics.overdueTasks} overdue
        </Badge>
      ),
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={item}
          className="group rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 cursor-default"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${card.iconBg}`}>
              <span className={card.iconColor}>{card.icon}</span>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {card.label}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            <AnimatedNumber
              value={card.value}
              prefix={card.prefix}
              decimals={card.decimals}
            />
          </h3>
          <div>{card.badge}</div>
        </motion.div>
      ))}
    </motion.div>
  );
};
