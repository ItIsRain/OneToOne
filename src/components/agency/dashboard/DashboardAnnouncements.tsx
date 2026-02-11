"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Badge from "@/components/ui/badge/Badge";
import { SessionExpiredError } from "@/lib/fetch";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  category: string;
  priority: string;
  is_pinned: boolean;
  is_published: boolean;
  publish_at: string | null;
  expires_at: string | null;
  views_count: number;
  reactions: Record<string, number>;
  created_at: string;
  updated_at: string;
}

interface DashboardAnnouncementsProps {
  onAdd?: () => void;
  onView?: (announcement: Announcement) => void;
  // Optional: pre-loaded data from parent (combined endpoint)
  data?: Announcement[];
  isLoading?: boolean;
}

const categoryColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  general: "light",
  update: "primary",
  alert: "error",
  celebration: "success",
  policy: "warning",
  reminder: "warning",
};

const priorityColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  low: "light",
  normal: "primary",
  high: "warning",
  urgent: "error",
};

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export const DashboardAnnouncements: React.FC<DashboardAnnouncementsProps> = ({
  onAdd,
  onView,
  data: propData,
  isLoading: propLoading,
}) => {
  const [mounted, setMounted] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevent hydration mismatch from Date() calls
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if we should use props or fetch ourselves
  // If propLoading is provided (even if false), parent is managing data
  const parentManagesData = propLoading !== undefined;

  // Use prop data if available
  const effectiveAnnouncements = propData || announcements;
  const effectiveLoading = parentManagesData ? (propLoading || false) : loading;

  const fetchAnnouncements = useCallback(async () => {
    // Skip fetch if parent is managing data
    if (parentManagesData) return;

    setLoading(true);
    try {
      const res = await fetch("/api/announcements?limit=5");

      if (!res.ok) {
        if (res.status === 401 || res.headers.get("content-type")?.includes("text/html")) {
          throw new SessionExpiredError();
        }
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, string>).error || "Failed to fetch announcements");
      }

      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [parentManagesData]);

  useEffect(() => {
    if (!parentManagesData) {
      fetchAnnouncements();
    }
  }, [fetchAnnouncements, parentManagesData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Show skeleton during SSR and loading to prevent hydration mismatch
  if (!mounted || effectiveLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-8 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
              <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
              <div className="h-3 w-full bg-gray-50 dark:bg-gray-800/50 rounded" />
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
          Announcements
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

      {effectiveAnnouncements.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No announcements</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-3 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              Create the first announcement
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
          {effectiveAnnouncements.map((announcement) => (
            <motion.div
              key={announcement.id}
              variants={listItem}
              onClick={() => onView?.(announcement)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                announcement.is_pinned
                  ? "bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 hover:border-brand-300 dark:hover:border-brand-500/30"
                  : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {announcement.is_pinned && (
                      <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
                    )}
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {announcement.title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {announcement.excerpt || announcement.content.substring(0, 100)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge size="sm" color={categoryColors[announcement.category] || "light"}>
                      {announcement.category}
                    </Badge>
                    {announcement.priority !== "normal" && (
                      <Badge size="sm" color={priorityColors[announcement.priority] || "light"}>
                        {announcement.priority}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatDate(announcement.created_at)}
                    </span>
                  </div>
                </div>
                {announcement.image_url && (
                  <img
                    src={announcement.image_url}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
