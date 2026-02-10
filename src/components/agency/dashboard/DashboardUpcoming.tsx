"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "@/components/ui/badge/Badge";

interface Task {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  status: string;
  project_id: string | null;
}

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  status: string;
  event_type: string | null;
}

export interface UpcomingData {
  tasks: Task[];
  events: Event[];
}

interface DashboardUpcomingProps {
  // Optional: pre-loaded data from parent (combined endpoint)
  data?: UpcomingData | null;
  isLoading?: boolean;
}

const priorityColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  low: "light",
  medium: "primary",
  high: "warning",
  urgent: "error",
};

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export const DashboardUpcoming: React.FC<DashboardUpcomingProps> = ({
  data: propData,
  isLoading: propLoading,
}) => {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<UpcomingData>({ tasks: [], events: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "events">("tasks");

  // Prevent hydration mismatch from Date() calls
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if we should use props or fetch ourselves
  // If propLoading is provided (even if false), parent is managing data
  const parentManagesData = propLoading !== undefined;

  // Use prop data if available
  const effectiveData = propData || data;
  const effectiveLoading = parentManagesData ? (propLoading || false) : loading;

  useEffect(() => {
    // Skip fetch if parent is managing data
    if (parentManagesData) return;

    const abortController = new AbortController();
    setLoading(true);
    setError(false);

    fetch("/api/dashboard/stats", { signal: abortController.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        if (!abortController.signal.aborted && result.upcoming) {
          setData(result.upcoming);
        }
      })
      .catch((err) => {
        if (!abortController.signal.aborted && err.name !== "AbortError") {
          setError(true);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [parentManagesData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDateChip = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return { day, month };
  };

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  // Show skeleton during SSR and loading to prevent hydration mismatch
  if (!mounted || effectiveLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="h-6 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-20 bg-gray-50 dark:bg-gray-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !parentManagesData) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming This Week
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-error-100 dark:bg-error-500/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Failed to load upcoming items</p>
        </div>
      </div>
    );
  }

  const isEmpty = effectiveData.tasks.length === 0 && effectiveData.events.length === 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming This Week
        </h3>
      </div>

      {/* Pill-style tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
        {(["tasks", "events"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === tab
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab === "tasks" ? "Tasks" : "Events"} ({tab === "tasks" ? effectiveData.tasks.length : effectiveData.events.length})
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Nothing scheduled this week</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "tasks" && (
              <>
                {effectiveData.tasks.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-6">
                    No tasks due this week
                  </p>
                ) : (
                  <motion.div className="space-y-2" variants={listContainer} initial="hidden" animate="show">
                    {effectiveData.tasks.map((task) => {
                      const chip = getDateChip(task.due_date);
                      const overdue = isOverdue(task.due_date);
                      return (
                        <motion.div
                          key={task.id}
                          variants={listItem}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                              overdue
                                ? "bg-error-100 dark:bg-error-500/15"
                                : "bg-brand-100 dark:bg-brand-500/15"
                            }`}
                          >
                            <span className={`text-[10px] font-medium leading-none ${overdue ? "text-error-500" : "text-brand-500"}`}>
                              {chip.month}
                            </span>
                            <span className={`text-sm font-bold leading-tight ${overdue ? "text-error-600 dark:text-error-400" : "text-brand-600 dark:text-brand-400"}`}>
                              {chip.day}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-xs ${
                                  overdue
                                    ? "text-error-500 font-medium"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {formatDate(task.due_date)}
                              </span>
                              <Badge size="sm" color={priorityColors[task.priority] || "light"}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </>
            )}

            {activeTab === "events" && (
              <>
                {effectiveData.events.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-6">
                    No events this week
                  </p>
                ) : (
                  <motion.div className="space-y-2" variants={listContainer} initial="hidden" animate="show">
                    {effectiveData.events.map((event) => {
                      const chip = getDateChip(event.start_date);
                      return (
                        <motion.div
                          key={event.id}
                          variants={listItem}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-medium leading-none text-amber-500">
                              {chip.month}
                            </span>
                            <span className="text-sm font-bold leading-tight text-amber-600 dark:text-amber-400">
                              {chip.day}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {event.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(event.start_date)} at {formatTime(event.start_date)}
                              </span>
                              {event.event_type && (
                                <Badge size="sm" color="light">
                                  {event.event_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
