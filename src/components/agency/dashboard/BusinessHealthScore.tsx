"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryDetails {
  [key: string]: string | number | null | undefined;
}

interface Category {
  score: number;
  label: string;
  details: CategoryDetails;
}

interface Alert {
  type: "warning" | "danger" | "info" | "success";
  message: string;
}

interface BusinessHealthData {
  score: number;
  grade: string;
  gradeLabel: string;
  categories: {
    financial: Category;
    operational: Category;
    client: Category;
    growth: Category;
  };
  alerts: Alert[];
  updatedAt: string;
}

function useCountUp(end: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration]);

  return count;
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500", bgLight: "bg-emerald-50 dark:bg-emerald-500/10" };
  if (score >= 60) return { ring: "#3b82f6", bg: "bg-blue-500", text: "text-blue-500", bgLight: "bg-blue-50 dark:bg-blue-500/10" };
  if (score >= 40) return { ring: "#f59e0b", bg: "bg-amber-500", text: "text-amber-500", bgLight: "bg-amber-50 dark:bg-amber-500/10" };
  return { ring: "#ef4444", bg: "bg-red-500", text: "text-red-500", bgLight: "bg-red-50 dark:bg-red-500/10" };
}

function getAlertStyles(type: Alert["type"]) {
  switch (type) {
    case "success":
      return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    case "warning":
      return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    case "danger":
      return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
    case "info":
      return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
  }
}

function getAlertIcon(type: Alert["type"]) {
  switch (type) {
    case "success":
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "warning":
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case "danger":
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "info":
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

const categoryIcons: Record<string, React.ReactNode> = {
  financial: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  operational: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  client: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  growth: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

const categoryDetailLabels: Record<string, Record<string, string>> = {
  financial: {
    revenueThisMonth: "Revenue (This Month)",
    revenueGrowth: "Revenue Growth",
    totalOutstanding: "Outstanding AR",
    overdueAmount: "Overdue Amount",
    overdueInvoiceCount: "Overdue Invoices",
    collectionRate: "Collection Rate",
    cashFlowRatio: "Cash Flow Ratio",
  },
  operational: {
    activeProjects: "Active Projects",
    overdueProjects: "Overdue Projects",
    onTimeRate: "On-Time Delivery",
    taskCompletionRate: "Task Completion",
    overdueTasks: "Overdue Tasks",
    activeTasks: "Active Tasks",
    utilizationRate: "Team Utilization",
    teamSize: "Team Size",
  },
  client: {
    totalClients: "Total Clients",
    activeClients: "Active Clients",
    newThisMonth: "New This Month",
    retentionRate: "Retention Rate",
    contractCoverage: "Contract Coverage",
    activeContracts: "Active Contracts",
  },
  growth: {
    leadsThisMonth: "Leads This Month",
    leadsLastMonth: "Leads Last Month",
    leadGrowth: "Lead Growth",
    conversionRate: "Conversion Rate",
    pipelineValue: "Pipeline Value",
    openProposals: "Open Proposals",
    proposalWinRate: "Win Rate",
    newClients: "New Clients",
  },
};

function formatDetailValue(key: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string") return value;
  if (key.includes("Rate") || key.includes("rate") || key.includes("Growth") || key.includes("growth") || key.includes("WinRate") || key.includes("Coverage") || key.includes("coverage")) {
    return `${value}%`;
  }
  if (key.includes("revenue") || key.includes("Revenue") || key.includes("Amount") || key.includes("amount") || key.includes("Outstanding") || key.includes("outstanding") || key.includes("Value") || key.includes("value")) {
    return `$${value.toLocaleString()}`;
  }
  if (key === "cashFlowRatio") {
    return `${value}x`;
  }
  return value.toLocaleString();
}

function CircularGauge({ score, size = 200 }: { score: number; size?: number }) {
  const animatedScore = useCountUp(score, 2000);
  const color = getScoreColor(score);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-100 dark:text-gray-800"
          strokeWidth={strokeWidth}
        />
        {/* Animated score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        {/* Glow effect */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.ring}
          strokeWidth={strokeWidth + 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity={0.15}
          style={{
            transition: "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: "blur(6px)",
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${color.text}`}>
          {animatedScore}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          out of 100
        </span>
      </div>
    </div>
  );
}

function MiniBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{
          width: `${width}%`,
          transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

export function BusinessHealthScore() {
  const [data, setData] = useState<BusinessHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/business-health");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load business health score");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="w-[200px] h-[200px] rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="flex-1 w-full space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = getScoreColor(data.score);
  const categories = Object.entries(data.categories) as [string, Category][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${scoreColor.bgLight}`}>
            <svg className={`w-5 h-5 ${scoreColor.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Business Health Score
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Updated {new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${scoreColor.text} ${scoreColor.bgLight}`}>
          {data.grade}
        </span>
      </div>

      {/* Main content */}
      <div className="px-6 pb-5">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
          {/* Circular Gauge */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <CircularGauge score={data.score} />
            <span className={`text-sm font-semibold ${scoreColor.text}`}>
              {data.gradeLabel}
            </span>
          </div>

          {/* Categories */}
          <div className="flex-1 w-full space-y-3">
            {categories.map(([key, cat]) => {
              const catColor = getScoreColor(cat.score);
              const isExpanded = expandedCategory === key;
              const details = categoryDetailLabels[key] || {};

              return (
                <div key={key}>
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : key)}
                    className="w-full group"
                  >
                    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isExpanded
                        ? "bg-gray-50 dark:bg-gray-800/70 ring-1 ring-gray-200 dark:ring-gray-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}>
                      <div className={`p-1.5 rounded-lg ${catColor.bgLight}`}>
                        <span className={catColor.text}>
                          {categoryIcons[key]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {cat.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${catColor.text}`}>
                              {cat.score}
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <MiniBar score={cat.score} color={catColor.bg} />
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2 px-3 pt-2 pb-1">
                          {Object.entries(details).map(([detailKey, label]) => {
                            const value = cat.details[detailKey];
                            if (value === null || value === undefined) return null;
                            return (
                              <div
                                key={detailKey}
                                className="flex flex-col px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/40"
                              >
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  {label}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-white/90 mt-0.5">
                                  {formatDetailValue(detailKey, value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Insights
            </h4>
            <div className="space-y-2">
              {data.alerts.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium ${getAlertStyles(alert.type)}`}
                >
                  {getAlertIcon(alert.type)}
                  {alert.message}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
