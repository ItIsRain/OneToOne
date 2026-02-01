"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FeatureGate } from "@/components/ui/FeatureGate";

// ── Types ──────────────────────────────────────────────────────────────────
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
  original_scope: string[];
  indicators: Indicator[];
  risk_score: number;
  risk_level: string;
}

interface AIAnalysis {
  risk_summary: string;
  scope_creep_items: {
    title: string;
    description: string;
    severity: string;
    estimated_impact_hours: number | null;
    recommendation: string;
  }[];
  change_order_needed: boolean;
  change_order_reason: string | null;
  estimated_unscoped_value: number;
  recommendations: string[];
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

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

const severityConfig = {
  high: { label: "High", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  low: { label: "Low", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
};

const riskConfig: Record<string, { label: string; cls: string; ring: string }> = {
  high: { label: "High Risk", cls: "bg-red-500 text-white", ring: "ring-red-200 dark:ring-red-900/40" },
  medium: { label: "Medium Risk", cls: "bg-amber-400 text-amber-900", ring: "ring-amber-200 dark:ring-amber-900/40" },
  low: { label: "Low Risk", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", ring: "" },
  none: { label: "Clear", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", ring: "" },
};

const indicatorIcons: Record<string, string> = {
  hours_overrun: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  budget_overrun: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  scope_expansion: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
  late_additions: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  deadline_passed: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
  deadline_risk: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
  margin_erosion: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
};

// ── Component ──────────────────────────────────────────────────────────────
export default function ScopeCreepPage() {
  const [data, setData] = useState<ScopeCreepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiAnalyses, setAiAnalyses] = useState<Record<string, AIAnalysis>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>("all");

  // Read ?project= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    if (projectId) setExpandedId(projectId);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/scope-creep");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scope analysis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAIAnalysis = async (projectId: string) => {
    if (aiAnalyses[projectId]) return; // Already have it
    setAiLoading(projectId);
    try {
      const res = await fetch("/api/ai/scope-creep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.analysis) {
        setAiAnalyses((prev) => ({ ...prev, [projectId]: json.analysis }));
      }
    } catch {
      // Silently fail — the rule-based analysis is still shown
    } finally {
      setAiLoading(null);
    }
  };

  if (loading) {
    return (
      <FeatureGate feature="projects">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </FeatureGate>
    );
  }

  if (error) {
    return (
      <FeatureGate feature="projects">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-error-500">{error}</p>
          <button onClick={fetchData} className="mt-2 text-brand-500 hover:text-brand-600">Try again</button>
        </div>
      </FeatureGate>
    );
  }

  if (!data) return null;

  const { analyses, summary } = data;
  const filtered = riskFilter === "all" ? analyses : analyses.filter((a) => a.risk_level === riskFilter);

  return (
    <FeatureGate feature="projects">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Scope Creep Detector</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor active projects for scope creep, budget overruns, and unscoped work
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Active Projects" value={summary.total_projects.toString()} color="text-gray-900 dark:text-white" />
          <StatCard
            label="High Risk"
            value={summary.high_risk.toString()}
            color={summary.high_risk > 0 ? "text-red-500" : "text-gray-900 dark:text-white"}
            icon={summary.high_risk > 0 ? "!" : undefined}
          />
          <StatCard
            label="Medium Risk"
            value={summary.medium_risk.toString()}
            color={summary.medium_risk > 0 ? "text-amber-500" : "text-gray-900 dark:text-white"}
          />
          <StatCard label="Clear" value={summary.no_risk.toString()} color="text-emerald-500" />
          <StatCard
            label="Unscoped Value"
            value={summary.estimated_unscoped_value > 0 ? formatCurrency(summary.estimated_unscoped_value) : "$0"}
            sub="Estimated out-of-scope costs"
            color={summary.estimated_unscoped_value > 0 ? "text-red-500" : "text-gray-900 dark:text-white"}
          />
        </div>

        {/* Risk filter */}
        <div className="flex items-center gap-2">
          {[
            { key: "all", label: "All" },
            { key: "high", label: "High Risk" },
            { key: "medium", label: "Medium" },
            { key: "low", label: "Low" },
            { key: "none", label: "Clear" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setRiskFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                riskFilter === f.key
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Project list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">No projects match this filter.</p>
            </div>
          )}

          {filtered.map((item) => {
            const isExpanded = expandedId === item.project.id;
            const risk = riskConfig[item.risk_level] || riskConfig.none;
            const ai = aiAnalyses[item.project.id];
            const isAiLoading = aiLoading === item.project.id;

            return (
              <div
                key={item.project.id}
                className={`rounded-2xl border bg-white dark:bg-white/[0.03] overflow-hidden transition-all ${
                  item.risk_level === "high"
                    ? "border-red-200 dark:border-red-900/40"
                    : item.risk_level === "medium"
                    ? "border-amber-200 dark:border-amber-900/40"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                {/* Project header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.project.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${risk.cls}`}>
                      {risk.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.project.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.project.client_name || "No client"}
                        {item.project.project_code ? ` · ${item.project.project_code}` : ""}
                        {" · "}{item.metrics.task_count} tasks · {item.metrics.total_actual_hours}h logged
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.indicators.length > 0 && (
                      <span className="text-xs text-gray-400">{item.indicators.length} alert{item.indicators.length !== 1 ? "s" : ""}</span>
                    )}
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-5">
                    {/* Metrics row */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      <MiniStat label="Tasks" value={`${item.metrics.completed_tasks}/${item.metrics.task_count}`} sub="completed" />
                      <MiniStat
                        label="Hours"
                        value={`${item.metrics.total_actual_hours}h`}
                        sub={item.project.estimated_hours ? `of ${item.project.estimated_hours}h est.` : "no estimate"}
                      />
                      <MiniStat
                        label="Labor Cost"
                        value={formatCurrency(item.metrics.total_labor_cost, item.project.currency)}
                        sub={item.project.budget ? `of ${formatCurrency(item.project.budget, item.project.currency)} budget` : "no budget"}
                      />
                      <MiniStat label="Invoiced" value={formatCurrency(item.metrics.total_invoiced, item.project.currency)} />
                      <MiniStat
                        label="Scope Source"
                        value={item.metrics.has_proposal ? "Proposal" : item.metrics.has_contract ? "Contract" : "None"}
                        sub={item.metrics.has_contract ? "+ Contract" : ""}
                      />
                    </div>

                    {/* Indicators */}
                    {item.indicators.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Alerts</h4>
                        <div className="space-y-2">
                          {item.indicators.map((ind, i) => {
                            const sev = severityConfig[ind.severity] || severityConfig.low;
                            const iconPath = indicatorIcons[ind.type] || indicatorIcons.scope_expansion;
                            return (
                              <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${sev.cls.replace("text-", "bg-").split(" ")[0]} bg-opacity-40 dark:bg-opacity-20`}>
                                <svg className="h-4 w-4 mt-0.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${sev.cls}`}>{sev.label}</span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{ind.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{ind.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Original scope */}
                    {item.original_scope.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Original Scope (from proposals/contracts)</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {item.original_scope.map((s, i) => (
                            <span key={i} className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Analysis section */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                      {!ai && (
                        <button
                          onClick={() => handleAIAnalysis(item.project.id)}
                          disabled={isAiLoading}
                          className="flex items-center gap-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 px-4 py-2.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors disabled:opacity-50"
                        >
                          {isAiLoading ? (
                            <>
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Analyzing with AI...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Run AI Deep Analysis
                            </>
                          )}
                        </button>
                      )}

                      {ai && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <h4 className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">AI Analysis</h4>
                          </div>

                          {/* Summary */}
                          <p className="text-sm text-gray-700 dark:text-gray-300">{ai.risk_summary}</p>

                          {/* Scope creep items */}
                          {ai.scope_creep_items?.length > 0 && (
                            <div className="space-y-2">
                              {ai.scope_creep_items.map((item, i) => (
                                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${(severityConfig[item.severity as keyof typeof severityConfig] || severityConfig.low).cls}`}>
                                      {item.severity}
                                    </span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-white">{item.title}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                                  {item.recommendation && (
                                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">Recommendation: {item.recommendation}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Change order */}
                          {ai.change_order_needed && (
                            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-3">
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Change Order Recommended</p>
                              <p className="text-xs text-amber-600 dark:text-amber-500">{ai.change_order_reason}</p>
                              {ai.estimated_unscoped_value > 0 && (
                                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-1">
                                  Estimated value: {formatCurrency(ai.estimated_unscoped_value)}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Recommendations */}
                          {ai.recommendations?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Recommendations</p>
                              <ul className="space-y-1">
                                {ai.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="text-brand-500 mt-0.5">-</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          <p>
            Scope creep is detected by comparing current tasks, hours, and costs against original project estimates, proposals, and contracts.
            AI deep analysis uses OpenRouter to identify specific out-of-scope work items and suggest change orders.
          </p>
        </div>
      </div>
    </FeatureGate>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {icon && <span className="text-red-500 font-bold">{icon}</span>}
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-800 dark:text-white">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}
