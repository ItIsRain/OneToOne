"use client";
import React, { useState, useEffect, useCallback } from "react";

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  created_at: string;
}

const typeColors: Record<string, string> = {
  client: "bg-brand-500",
  project: "bg-purple-500",
  task: "bg-success-500",
  invoice: "bg-blue-500",
  payment: "bg-green-500",
  event: "bg-warning-500",
  file: "bg-gray-500",
  folder: "bg-gray-400",
  announcement: "bg-pink-500",
  goal: "bg-orange-500",
  default: "bg-gray-400",
};

const actionIcons: Record<string, string> = {
  created: "+",
  updated: "~",
  deleted: "-",
  completed: "✓",
  assigned: "→",
  commented: "💬",
  viewed: "👁",
};

export const DashboardActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/activity?limit=10");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch activities");
      }

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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <p className="text-error-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Activity
        </h3>
        <button className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
          View all
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Activity will appear here as you use the platform
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    typeColors[activity.entity_type] || typeColors.default
                  }`}
                  title={activity.entity_type}
                />
                {index !== activities.length - 1 && (
                  <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {getActivityTitle(activity)}
                  </p>
                  <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                    {actionIcons[activity.action] || "•"}
                  </span>
                </div>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                  {activity.description || activity.entity_name || "No details"}
                </p>
                <span className="text-gray-400 text-theme-xs dark:text-gray-500">
                  {formatTime(activity.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
