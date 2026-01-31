"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  created_at: string;
}

const typeConfig: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  client: {
    bg: "bg-brand-100 dark:bg-brand-500/15",
    color: "text-brand-600 dark:text-brand-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  project: {
    bg: "bg-purple-100 dark:bg-purple-500/15",
    color: "text-purple-600 dark:text-purple-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  task: {
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    color: "text-emerald-600 dark:text-emerald-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  invoice: {
    bg: "bg-blue-100 dark:bg-blue-500/15",
    color: "text-blue-600 dark:text-blue-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  payment: {
    bg: "bg-green-100 dark:bg-green-500/15",
    color: "text-green-600 dark:text-green-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  event: {
    bg: "bg-amber-100 dark:bg-amber-500/15",
    color: "text-amber-600 dark:text-amber-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  announcement: {
    bg: "bg-pink-100 dark:bg-pink-500/15",
    color: "text-pink-600 dark:text-pink-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  goal: {
    bg: "bg-orange-100 dark:bg-orange-500/15",
    color: "text-orange-600 dark:text-orange-400",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
};

const defaultConfig = {
  bg: "bg-gray-100 dark:bg-gray-800",
  color: "text-gray-500 dark:text-gray-400",
  icon: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export const DashboardActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/activity?limit=10");

      if (!res.ok) {
        if (res.status === 401 || res.headers.get("content-type")?.includes("text/html")) {
          throw new Error("Session expired. Please refresh the page.");
        }
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error || "Failed to fetch activities");
      }

      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getActivityTitle = (activity: Activity) => {
    const entityType = activity.entity_type.charAt(0).toUpperCase() + activity.entity_type.slice(1);
    const action = activity.action;

    switch (action) {
      case "created":
        return `New ${entityType.toLowerCase()} created`;
      case "updated":
        return `${entityType} updated`;
      case "deleted":
        return `${entityType} deleted`;
      case "completed":
        return `${entityType} completed`;
      case "assigned":
        return `${entityType} assigned`;
      default:
        return `${entityType} ${action}`;
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-20 bg-gray-50 dark:bg-gray-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-5 dark:border-error-800 dark:bg-error-900/20">
        <p className="text-error-600 dark:text-error-400 text-sm">{error}</p>
        <button
          onClick={fetchActivities}
          className="mt-2 text-sm text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <button className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors">
          View all
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No recent activity</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Activity will appear here as you use the platform
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-1"
          variants={listContainer}
          initial="hidden"
          animate="show"
        >
          {activities.map((activity) => {
            const config = typeConfig[activity.entity_type] || defaultConfig;
            return (
              <motion.div
                key={activity.id}
                variants={listItem}
                className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-default"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${config.bg}`}>
                  <span className={config.color}>{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getActivityTitle(activity)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {activity.description || activity.entity_name || "No details"}
                  </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 pt-0.5">
                  {formatTime(activity.created_at)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
