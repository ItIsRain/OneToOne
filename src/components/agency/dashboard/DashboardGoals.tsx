"use client";
import React, { useState, useEffect, useCallback } from "react";

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
}

export const DashboardGoals: React.FC<DashboardGoalsProps> = ({
  onAdd,
  onView,
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals?status=active");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch goals");
      }

      setGoals(data.goals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

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

  const getProgressColor = (progress: number, color: string) => {
    if (progress >= 100) return "bg-success-500";
    if (progress >= 75) return "bg-success-400";
    if (progress >= 50) return "bg-warning-500";
    if (progress >= 25) return "bg-warning-400";
    return color ? `bg-[${color}]` : "bg-brand-500";
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Goals & KPIs
        </h3>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        )}
      </div>

      {error && (
        <p className="text-error-500 text-sm mb-4">{error}</p>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No active goals</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-3 text-sm text-brand-500 hover:text-brand-600"
            >
              Set your first goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {goals.slice(0, 5).map((goal) => {
            const progress = getProgress(goal);
            return (
              <div
                key={goal.id}
                onClick={() => onView?.(goal)}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {goal.icon ? (
                      <span className="text-lg">{goal.icon}</span>
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: goal.color }}
                      />
                    )}
                    <h4 className="font-medium text-gray-800 dark:text-white/90">
                      {goal.title}
                    </h4>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {progress}%
                  </span>
                </div>

                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      progress >= 100
                        ? "bg-success-500"
                        : progress >= 75
                        ? "bg-success-400"
                        : progress >= 50
                        ? "bg-warning-500"
                        : "bg-brand-500"
                    }`}
                    style={{ width: `${progress}%` }}
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
              </div>
            );
          })}

          {goals.length > 5 && (
            <button className="w-full text-center text-sm text-brand-500 hover:text-brand-600 py-2">
              View all {goals.length} goals
            </button>
          )}
        </div>
      )}
    </div>
  );
};
