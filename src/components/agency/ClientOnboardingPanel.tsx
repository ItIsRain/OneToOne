"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────

interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  completed_at: string | null;
  completed_by: string | null;
  notes?: string | null;
}

interface Onboarding {
  id: string;
  client_id: string;
  template_id: string | null;
  status: "in_progress" | "completed" | "paused";
  steps: OnboardingStep[];
  started_at: string;
  completed_at: string | null;
  client_onboarding_templates?: { name: string } | null;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  steps: OnboardingStep[];
  is_default: boolean;
}

interface ClientOnboardingPanelProps {
  clientId: string;
}

// ─── Step type config ─────────────────────────────────────────────────

const stepTypeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  email: {
    label: "Email",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-500/15",
    icon: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  form: {
    label: "Form",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-500/15",
    icon: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
  },
  contract: {
    label: "Contract",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-500/15",
    icon: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    ),
  },
  meeting: {
    label: "Meeting",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    icon: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  access: {
    label: "Access",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-500/15",
    icon: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
  },
  task: {
    label: "Task",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    icon: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  other: {
    label: "Other",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    icon: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
};

function getStepConfig(type: string) {
  return stepTypeConfig[type] || stepTypeConfig.other;
}

// ─── Main Component ──────────────────────────────────────────────────

export function ClientOnboardingPanel({ clientId }: ClientOnboardingPanelProps) {
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchOnboarding = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/onboarding`);
      if (!res.ok) return;
      const data = await res.json();
      setOnboarding(data.onboarding);
      setTemplates(data.templates || []);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  const startOnboarding = async (templateId?: string) => {
    setActionLoading("start");
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateId ? { template_id: templateId } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOnboarding(data.onboarding);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start onboarding");
    } finally {
      setActionLoading(null);
    }
  };

  const updateStep = async (stepId: string, status: string, sendEmail?: boolean) => {
    setActionLoading(stepId);
    try {
      const res = await fetch(`/api/clients/${clientId}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step_id: stepId, step_status: status, send_email: sendEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOnboarding(data.onboarding);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update step");
    } finally {
      setActionLoading(null);
    }
  };

  const resetOnboarding = async () => {
    if (!confirm("Reset onboarding? This will remove all progress.")) return;
    setActionLoading("reset");
    try {
      const res = await fetch(`/api/clients/${clientId}/onboarding`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setOnboarding(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // No onboarding started — show start options
  if (!onboarding) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Onboarding</h4>
          </div>
        </div>
        <div className="p-4">
          {error && (
            <p className="text-xs text-error-500 mb-3">{error}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Start an onboarding flow to guide this client through your process.
          </p>

          {templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => startOnboarding(t.id)}
                  disabled={actionLoading === "start"}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {t.name}
                      {t.is_default && (
                        <span className="ml-1.5 text-[10px] font-semibold text-brand-500">DEFAULT</span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {(t.steps as OnboardingStep[]).length} steps
                      {t.description ? ` · ${t.description}` : ""}
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                </button>
              ))}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-white px-2 text-gray-400 dark:bg-gray-900 dark:text-gray-500">or</span>
                </div>
              </div>
              <button
                onClick={() => startOnboarding()}
                disabled={actionLoading === "start"}
                className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                {actionLoading === "start" ? "Starting..." : "Start with default steps"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => startOnboarding()}
              disabled={actionLoading === "start"}
              className="w-full rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {actionLoading === "start" ? "Starting..." : "Start Onboarding"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Onboarding in progress or completed — show tracker
  const steps = onboarding.steps as OnboardingStep[];
  const completedCount = steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const isComplete = onboarding.status === "completed";
  const isPaused = onboarding.status === "paused";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Onboarding</h4>
            {isComplete && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                Complete
              </span>
            )}
            {isPaused && (
              <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-semibold text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
                Paused
              </span>
            )}
          </div>
          <button
            onClick={resetOnboarding}
            disabled={actionLoading === "reset"}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            title="Reset onboarding"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {completedCount} of {steps.length} steps
            </span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-brand-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Steps list */}
      <div className="p-3">
        {error && <p className="text-xs text-error-500 mb-2 px-1">{error}</p>}

        <AnimatePresence initial={false}>
          <div className="space-y-1">
            {steps.map((step, index) => {
              const config = getStepConfig(step.type);
              const isCompleted = step.status === "completed";
              const isSkipped = step.status === "skipped";
              const isActive = !isCompleted && !isSkipped;
              const isFirstPending = isActive && steps.findIndex((s) => s.status === "pending" || s.status === "in_progress") === index;

              return (
                <motion.div
                  key={step.id}
                  layout
                  className={`group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                    isFirstPending
                      ? "bg-brand-50/50 dark:bg-brand-500/5 ring-1 ring-brand-200/50 dark:ring-brand-500/20"
                      : isCompleted
                      ? "opacity-60"
                      : ""
                  }`}
                >
                  {/* Step indicator */}
                  <button
                    onClick={() =>
                      updateStep(step.id, isCompleted ? "pending" : "completed")
                    }
                    disabled={actionLoading === step.id || isPaused}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isSkipped
                        ? "border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700"
                        : "border-gray-300 hover:border-brand-400 dark:border-gray-600 dark:hover:border-brand-500"
                    } disabled:cursor-not-allowed`}
                    title={isCompleted ? "Mark as pending" : "Mark as complete"}
                  >
                    {actionLoading === step.id ? (
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : isCompleted ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : isSkipped ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
                      </svg>
                    ) : (
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">{index + 1}</span>
                    )}
                  </button>

                  {/* Step content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium ${isCompleted || isSkipped ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
                        {step.title}
                      </p>
                      <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold ${config.color} ${config.bg}`}>
                        {config.icon}
                        <span className="ml-0.5">{config.label}</span>
                      </span>
                    </div>
                    {step.description && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                        {step.description}
                      </p>
                    )}
                    {step.completed_at && step.completed_by && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        Completed by {step.completed_by} · {new Date(step.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>

                  {/* Action buttons for active steps */}
                  {isActive && !isPaused && (
                    <div className="flex items-center gap-1 shrink-0">
                      {step.type === "email" && (
                        <button
                          onClick={() => updateStep(step.id, "completed", true)}
                          disabled={actionLoading === step.id}
                          className="shrink-0 flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-all disabled:opacity-50"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                          </svg>
                          Send Email
                        </button>
                      )}
                      <button
                        onClick={() => updateStep(step.id, "skipped")}
                        disabled={actionLoading === step.id}
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-all"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>

      {/* Completed message */}
      {isComplete && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-500/5">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
            <span className="font-medium">Onboarding complete!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientOnboardingPanel;
