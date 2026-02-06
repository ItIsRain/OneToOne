"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────

interface ScheduleItem {
  id: string;
  type: "event" | "appointment";
  title: string;
  time: string;
  endTime?: string | null;
  location?: string | null;
  eventType?: string | null;
  isVirtual?: boolean;
  attendeeName?: string;
  attendeeEmail?: string;
  path: string;
}

interface OverdueInvoice {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  path: string;
}

interface TaskItem {
  id: string;
  title: string;
  priority?: string;
  dueDate?: string;
  status?: string;
  path: string;
}

interface ProposalItem {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  path: string;
}

interface LeadItem {
  id: string;
  name: string;
  company: string | null;
  status: string;
  createdAt: string;
  path: string;
}

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
  path: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string | null;
}

interface BriefingData {
  firstName: string;
  todaySchedule: ScheduleItem[];
  overdueInvoices: {
    count: number;
    totalAmount: number;
    items: OverdueInvoice[];
  };
  blockedTasks: TaskItem[];
  overdueTasks: TaskItem[];
  pipelineActivity: {
    activeProposals: ProposalItem[];
    recentLeads: LeadItem[];
  };
  upcomingDeadlines: DeadlineItem[];
  teamSnapshot: {
    totalMembers: number;
    members: TeamMember[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysOverdue(dateString: string): number {
  const now = new Date();
  const due = new Date(dateString);
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const priorityConfig: Record<string, { color: string; bg: string }> = {
  urgent: { color: "text-error-600 dark:text-error-400", bg: "bg-error-100 dark:bg-error-500/15" },
  high: { color: "text-warning-600 dark:text-warning-400", bg: "bg-warning-100 dark:bg-warning-500/15" },
  medium: { color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-100 dark:bg-brand-500/15" },
  low: { color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
};

// ─── Animation variants ──────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

const staggerCards = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// ─── Sub-components ──────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  count,
  accentColor,
  children,
  linkHref,
  linkLabel,
  emptyMessage,
  isEmpty,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  accentColor: string;
  children: React.ReactNode;
  linkHref?: string;
  linkLabel?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accentColor}`}>
            {icon}
          </span>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
          {count !== undefined && count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {count}
            </span>
          )}
        </div>
        {linkHref && linkLabel && (
          <Link
            href={linkHref}
            className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
          >
            {linkLabel}
          </Link>
        )}
      </div>
      <div className="px-5 py-3">
        {isEmpty ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-2">{emptyMessage || "Nothing here"}</p>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] || priorityConfig.low;
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.color} ${config.bg}`}>
      {priority}
    </span>
  );
}

function InitialsAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === "md" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]";

  return (
    <div className={`flex ${sizeClass} items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400`}>
      {initials}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

interface MorningBriefingProps {
  onDismiss?: () => void;
  // Optional: pre-loaded data from parent (combined endpoint)
  data?: BriefingData | null;
  isLoading?: boolean;
}

export function MorningBriefing({ onDismiss, data: propData, isLoading: propLoading }: MorningBriefingProps) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(propData === undefined);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);

  // Use prop data if available
  const effectiveData = propData || data;
  const effectiveLoading = propLoading !== undefined ? propLoading : loading;

  const fetchBriefing = useCallback(async () => {
    // Skip fetch if data is provided via props
    if (propData !== undefined) return;

    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/dashboard/briefing");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [propData]);

  useEffect(() => {
    // Check if briefing was dismissed today
    const dismissedDate = sessionStorage.getItem("briefing-dismissed");
    if (dismissedDate === new Date().toDateString()) {
      setDismissed(true);
      setLoading(false);
      return;
    }
    // Only fetch if no prop data provided
    if (propData === undefined) {
      fetchBriefing();
    }
  }, [fetchBriefing, propData]);

  const handleDismiss = () => {
    sessionStorage.setItem("briefing-dismissed", new Date().toDateString());
    setDismissed(true);
    onDismiss?.();
  };

  const handleRefresh = () => {
    fetchBriefing();
  };

  // Loading skeleton
  if (effectiveLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div>
              <div className="h-5 w-44 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="h-3 w-28 rounded bg-gray-50 dark:bg-gray-800/50 animate-pulse mt-1.5" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-50 dark:bg-gray-800/50 rounded" />
                <div className="h-3 w-3/4 bg-gray-50 dark:bg-gray-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dismissed — show minimal restore option
  if (dismissed) {
    return (
      <button
        onClick={() => {
          sessionStorage.removeItem("briefing-dismissed");
          setDismissed(false);
          fetchBriefing();
        }}
        className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-4 py-2.5 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-600 dark:border-gray-700 dark:text-gray-500 dark:hover:border-gray-600 dark:hover:text-gray-400 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
        Show morning briefing
      </button>
    );
  }

  // Error state
  if (error || !effectiveData) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Could not load briefing.</p>
          <button
            onClick={handleRefresh}
            className="text-sm text-brand-500 hover:text-brand-600 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Determine which sections have content
  const hasSchedule = effectiveData.todaySchedule.length > 0;
  const hasOverdueInvoices = effectiveData.overdueInvoices.count > 0;
  const hasBlockedTasks = effectiveData.blockedTasks.length > 0;
  const hasOverdueTasks = effectiveData.overdueTasks.length > 0;
  const hasProposals = effectiveData.pipelineActivity.activeProposals.length > 0;
  const hasLeads = effectiveData.pipelineActivity.recentLeads.length > 0;
  const hasPipeline = hasProposals || hasLeads;
  const hasDeadlines = effectiveData.upcomingDeadlines.length > 0;
  const hasTeam = effectiveData.teamSnapshot.totalMembers > 1;

  const sectionCount = [hasSchedule, hasOverdueInvoices, hasBlockedTasks || hasOverdueTasks, hasPipeline, hasDeadlines, hasTeam].filter(Boolean).length;

  // If nothing to show
  const nothingToReport = sectionCount === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-50/50 to-transparent dark:from-brand-500/5 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/15">
              <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Morning Briefing
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              title="Refresh"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
            </button>
            <button
              onClick={handleDismiss}
              title="Dismiss for today"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Nothing to report */}
        {nothingToReport && (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">All clear!</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              No urgent items to review this morning.
            </p>
          </div>
        )}

        {/* Content grid */}
        {!nothingToReport && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5"
            variants={staggerCards}
            initial="hidden"
            animate="show"
          >
            {/* Today's Schedule */}
            {hasSchedule && (
              <SectionCard
                title="Today's Schedule"
                count={effectiveData.todaySchedule.length}
                accentColor="bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                icon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                }
                linkHref="/dashboard/events/calendar"
                linkLabel="View calendar"
              >
                <div className="space-y-2">
                  {effectiveData.todaySchedule.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.path}
                      className="flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <span className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 w-16 shrink-0">
                        {formatTime(item.time)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.type === "event" && item.isVirtual && (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Virtual</span>
                          )}
                          {item.location && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{item.location}</span>
                          )}
                          {item.attendeeName && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">with {item.attendeeName}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Overdue Invoices */}
            {hasOverdueInvoices && (
              <SectionCard
                title="Overdue Invoices"
                count={effectiveData.overdueInvoices.count}
                accentColor="bg-error-100 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                icon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
                linkHref="/dashboard/finance/invoices"
                linkLabel="View all"
              >
                <div className="mb-2.5">
                  <span className="text-lg font-bold text-error-600 dark:text-error-400">
                    {formatCurrency(effectiveData.overdueInvoices.totalAmount)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">total outstanding</span>
                </div>
                <div className="space-y-1.5">
                  {effectiveData.overdueInvoices.items.slice(0, 4).map((inv) => (
                    <Link
                      key={inv.id}
                      href={inv.path}
                      className="flex items-center justify-between rounded-lg px-2 py-1 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {inv.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-error-500">{daysOverdue(inv.dueDate)}d overdue</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(inv.amount)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Blocked & Overdue Tasks */}
            {(hasBlockedTasks || hasOverdueTasks) && (
              <SectionCard
                title="Tasks Needing Attention"
                count={effectiveData.blockedTasks.length + effectiveData.overdueTasks.length}
                accentColor="bg-warning-100 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                icon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                }
                linkHref="/dashboard/projects/tasks"
                linkLabel="View tasks"
              >
                <div className="space-y-1.5">
                  {effectiveData.blockedTasks.slice(0, 3).map((task) => (
                    <Link
                      key={task.id}
                      href={task.path}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <span className="flex h-5 items-center rounded bg-error-100 px-1.5 text-[10px] font-semibold text-error-600 dark:bg-error-500/15 dark:text-error-400">
                        BLOCKED
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {task.title}
                      </span>
                    </Link>
                  ))}
                  {effectiveData.overdueTasks.slice(0, 3).map((task) => (
                    <Link
                      key={task.id}
                      href={task.path}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <span className="flex h-5 items-center rounded bg-warning-100 px-1.5 text-[10px] font-semibold text-warning-600 dark:bg-warning-500/15 dark:text-warning-400">
                        {daysOverdue(task.dueDate!)}d LATE
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {task.title}
                      </span>
                      {task.priority && <PriorityBadge priority={task.priority} />}
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Pipeline Activity */}
            {hasPipeline && (
              <SectionCard
                title="Pipeline Activity"
                count={(effectiveData.pipelineActivity.activeProposals.length) + (effectiveData.pipelineActivity.recentLeads.length)}
                accentColor="bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400"
                icon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                }
                linkHref="/dashboard/crm/pipeline"
                linkLabel="View pipeline"
              >
                <div className="space-y-2">
                  {hasProposals && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Active Proposals</p>
                      {effectiveData.pipelineActivity.activeProposals.slice(0, 3).map((p) => (
                        <Link
                          key={p.id}
                          href={p.path}
                          className="flex items-center justify-between rounded-lg px-2 py-1 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {p.title}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                            {timeAgo(p.updatedAt)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {hasLeads && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">New Leads</p>
                      {effectiveData.pipelineActivity.recentLeads.slice(0, 3).map((l) => (
                        <Link
                          key={l.id}
                          href={l.path}
                          className="flex items-center justify-between rounded-lg px-2 py-1 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                          <div className="min-w-0">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {l.name}
                            </span>
                            {l.company && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1.5">{l.company}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                            {timeAgo(l.createdAt)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Upcoming Deadlines */}
            {hasDeadlines && (
              <SectionCard
                title="Upcoming Deadlines"
                count={effectiveData.upcomingDeadlines.length}
                accentColor="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                icon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
                linkHref="/dashboard/projects/tasks"
                linkLabel="View tasks"
              >
                <div className="space-y-1.5">
                  {effectiveData.upcomingDeadlines.slice(0, 5).map((d) => (
                    <Link
                      key={d.id}
                      href={d.path}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PriorityBadge priority={d.priority} />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {d.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                        {formatRelativeDate(d.dueDate)}
                      </span>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Team Snapshot */}
            {hasTeam && (
              <SectionCard
                title="Team"
                count={effectiveData.teamSnapshot.totalMembers}
                accentColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                icon={
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                }
                linkHref="/dashboard/team"
                linkLabel="View team"
              >
                <div className="flex flex-wrap gap-2">
                  {effectiveData.teamSnapshot.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5"
                      title={member.role || undefined}
                    >
                      {member.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <InitialsAvatar name={member.name} />
                      )}
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {member.name.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                  {effectiveData.teamSnapshot.totalMembers > 8 && (
                    <div className="flex items-center rounded-lg bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{effectiveData.teamSnapshot.totalMembers - 8} more
                      </span>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
