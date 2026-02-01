"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Indicator {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  value?: number;
}

interface ProjectAnalysis {
  project: {
    id: string;
    name: string;
    project_code: string | null;
    client_name: string | null;
    status: string;
    budget: number;
    estimated_hours: number;
    deadline: string | null;
    currency: string;
  };
  metrics: {
    task_count: number;
    completed_tasks: number;
    total_estimated_hours: number;
    total_actual_hours: number;
    total_labor_cost: number;
    total_invoiced: number;
    has_proposal: boolean;
    has_contract: boolean;
  };
  indicators: Indicator[];
  risk_score: number;
  risk_level: string;
}

interface ScopeCreepData {
  analyses: ProjectAnalysis[];
  summary: {
    total_projects: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
    no_risk: number;
    at_risk_count: number;
    estimated_unscoped_value: number;
  };
}

const severityColors = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const riskBadge: Record<string, { label: string; cls: string }> = {
  high: { label: "High Risk", cls: "bg-red-500 text-white" },
  medium: { label: "Medium", cls: "bg-amber-400 text-amber-900" },
  low: { label: "Low", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  none: { label: "Clear", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

export function ScopeCreepWidget() {
  const router = useRouter();
  const [data, setData] = useState<ScopeCreepData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/scope-creep")
      .then((res) => res.json())
      .then((json) => { if (json.analyses) setData(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!data || data.analyses.length === 0) return null;

  const atRisk = data.analyses.filter((a) => a.risk_level === "high" || a.risk_level === "medium");
  if (atRisk.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Scope Creep Alerts</h3>
          {data.summary.high_risk > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{data.summary.high_risk}</span>
          )}
        </div>
        <button
          onClick={() => router.push("/dashboard/projects/scope-creep")}
          className="text-xs text-brand-500 hover:text-brand-600 font-medium"
        >
          View all
        </button>
      </div>

      <div className="space-y-3">
        {atRisk.slice(0, 3).map((item) => {
          const badge = riskBadge[item.risk_level] || riskBadge.none;
          return (
            <button
              key={item.project.id}
              onClick={() => router.push(`/dashboard/projects/scope-creep?project=${item.project.id}`)}
              className="w-full text-left rounded-xl border border-gray-100 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.project.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{item.project.client_name || "No client"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              {item.indicators.length > 0 && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {item.indicators[0].message}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {data.summary.estimated_unscoped_value > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 px-3 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Est. unscoped work value: <span className="font-bold">${Math.round(data.summary.estimated_unscoped_value).toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default ScopeCreepWidget;
