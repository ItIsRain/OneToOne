"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  auto_track: boolean;
  track_entity: string | null;
  period_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  category: string | null;
  color: string;
  icon: string | null;
  milestones: Array<{ value: number; label: string; achieved_at?: string }>;
  updates: Array<{ date: string; value: number; note?: string }>;
  created_at: string;
  updated_at: string;
}

interface DashboardGoalsProps {
  onAdd?: () => void;
  onView?: (goal: Goal) => void;
  // Optional: pre-loaded data from parent (combined endpoint)
  data?: Goal[];
  isLoading?: boolean;
}

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export const DashboardGoals: React.FC<DashboardGoalsProps> = ({
  onAdd,
  onView,
  data: propData,
  isLoading: propLoading,
}) => {
  const [mounted, setMounted] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if we should use props or fetch ourselves
  // If propLoading is provided (even if false), parent is managing data
  const parentManagesData = propLoading !== undefined;

  // Use prop data if available
  const effectiveGoals = propData || goals;
  const effectiveLoading = parentManagesData ? (propLoading || false) : loading;

  const fetchGoals = useCallback(async () => {
    // Skip fetch if parent is managing data
    if (parentManagesData) return;

    setLoading(true);
    try {
      const res = await fetch("/api/goals?status=active");

      if (!res.ok) {
        if (res.status === 401 || res.headers.get("content-type")?.includes("text/html")) {
          throw new Error("Session expired. Please refresh the page.");
        }
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error || "Failed to fetch goals");
      }

      const data = await res.json();
      setGoals(data.goals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [parentManagesData]);

  useEffect(() => {
    if (!parentManagesData) {
      fetchGoals();
    }
  }, [fetchGoals, parentManagesData]);

  const getProgress = (goal: Goal) => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  const formatValue = (value: number, unit: string | null, type: string) => {
    if (type === "currency" || unit === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(value);
    }
    if (type === "percentage" || unit === "%") {
      return `${value}%`;
    }
    if (unit) {
      return `${value.toLocaleString()} ${unit}`;
    }
    return value.toLocaleString();
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return "bg-emerald-500";
    if (progress >= 75) return "bg-emerald-400";
    if (progress >= 50) return "bg-amber-500";
    return "bg-brand-500";
  };

  // Show skeleton during SSR and loading to prevent hydration mismatch
  if (!mounted || effectiveLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-8 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
              <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded mb-3" />
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Goals & KPIs
        </h3>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 dark:bg-error-900/20 p-3 mb-4">
          <p className="text-error-600 dark:text-error-400 text-sm">{error}</p>
        </div>
      )}

      {effectiveGoals.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No active goals</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-3 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              Set your first goal
            </button>
          )}
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={listContainer}
          initial="hidden"
          animate="show"
        >
          {effectiveGoals.slice(0, 5).map((goal) => {
            const progress = getProgress(goal);
            return (
              <motion.div
                key={goal.id}
                variants={listItem}
                onClick={() => onView?.(goal)}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {goal.icon ? (
                      <span className="text-lg flex-shrink-0">{goal.icon}</span>
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: goal.color }}
                      />
                    )}
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {goal.title}
                    </h4>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ml-2 ${
                    progress >= 100
                      ? "text-emerald-600 dark:text-emerald-400"
                      : progress >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {progress}%
                  </span>
                </div>

                {/* Animated progress bar */}
                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${getProgressBarColor(progress)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.2 }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {formatValue(goal.current_value, goal.unit, goal.target_type)}
                    {goal.target_value && (
                      <> / {formatValue(goal.target_value, goal.unit, goal.target_type)}</>
                    )}
                  </span>
                  <span className="capitalize">{goal.period_type}</span>
                </div>
              </motion.div>
            );
          })}

          {effectiveGoals.length > 5 && (
            <button className="w-full text-center text-sm text-brand-500 hover:text-brand-600 font-medium py-2 transition-colors">
              View all {effectiveGoals.length} goals
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};
