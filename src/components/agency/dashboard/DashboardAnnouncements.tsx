"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";

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

export const DashboardAnnouncements: React.FC<DashboardAnnouncementsProps> = ({
  onAdd,
  onView,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements?limit=5");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch announcements");
      }

      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
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
          Announcements
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

      {announcements.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No announcements</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-3 text-sm text-brand-500 hover:text-brand-600"
            >
              Create the first announcement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              onClick={() => onView?.(announcement)}
              className={`p-4 rounded-xl cursor-pointer transition-colors ${
                announcement.is_pinned
                  ? "bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20"
                  : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {announcement.is_pinned && (
                      <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
                    )}
                    <h4 className="font-medium text-gray-800 dark:text-white/90 truncate">
                      {announcement.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
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
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
