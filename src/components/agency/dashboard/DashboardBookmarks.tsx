"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export interface Bookmark {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string;
  url: string | null;
  icon: string | null;
  color: string | null;
  folder: string | null;
}

interface DashboardBookmarksProps {
  onAdd?: () => void;
  // Optional: pre-loaded data from parent (combined endpoint)
  data?: Bookmark[];
  isLoading?: boolean;
}

const entityTypeIcons: Record<string, React.ReactNode> = {
  client: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  project: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  task: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  invoice: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  event: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  file: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  folder: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  page: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  url: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
};

const entityTypeUrls: Record<string, (id: string) => string> = {
  client: (id) => `/dashboard/crm/clients?view=${id}`,
  project: (id) => `/dashboard/projects?view=${id}`,
  task: (id) => `/dashboard/tasks?view=${id}`,
  invoice: (id) => `/dashboard/finance/invoices?view=${id}`,
  event: (id) => `/dashboard/events?view=${id}`,
  file: (id) => `/dashboard/documents?view=${id}`,
  folder: (id) => `/dashboard/documents?folder=${id}`,
};

const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const gridItem = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export const DashboardBookmarks: React.FC<DashboardBookmarksProps> = ({
  onAdd,
  data: propData,
  isLoading: propLoading,
}) => {
  const [mounted, setMounted] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if we should use props or fetch ourselves
  // If propLoading is provided (even if false), parent is managing data
  const parentManagesData = propLoading !== undefined;

  // Use prop data if available
  const effectiveBookmarks = propData || bookmarks;
  const effectiveLoading = parentManagesData ? (propLoading || false) : loading;

  const fetchBookmarks = useCallback(async () => {
    // Skip fetch if parent is managing data
    if (parentManagesData) return;

    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) return;
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  }, [parentManagesData]);

  useEffect(() => {
    if (!parentManagesData) {
      fetchBookmarks();
    }
  }, [fetchBookmarks, parentManagesData]);

  const handleRemoveBookmark = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBookmarks(bookmarks.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  };

  const getBookmarkUrl = (bookmark: Bookmark) => {
    if (bookmark.url) return bookmark.url;
    if (bookmark.entity_id && entityTypeUrls[bookmark.entity_type]) {
      return entityTypeUrls[bookmark.entity_type](bookmark.entity_id);
    }
    return "#";
  };

  // Show skeleton during SSR and loading to prevent hydration mismatch
  if (!mounted || effectiveLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-8 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-pulse">
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Access
        </h3>
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        )}
      </div>

      {effectiveBookmarks.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No bookmarks yet</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-2 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              Add your first bookmark
            </button>
          )}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-2"
          variants={gridContainer}
          initial="hidden"
          animate="show"
        >
          {effectiveBookmarks.slice(0, 8).map((bookmark) => (
            <motion.div key={bookmark.id} variants={gridItem}>
              <Link
                href={getBookmarkUrl(bookmark)}
                className="group flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: bookmark.color
                      ? `${bookmark.color}20`
                      : "rgb(var(--color-brand-500) / 0.1)",
                  }}
                >
                  {bookmark.icon ? (
                    <span className="text-sm">{bookmark.icon}</span>
                  ) : (
                    <span style={{ color: bookmark.color || "rgb(var(--color-brand-500))" }}>
                      {entityTypeIcons[bookmark.entity_type] || entityTypeIcons.page}
                    </span>
                  )}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {bookmark.entity_name}
                </span>
                <button
                  onClick={(e) => handleRemoveBookmark(bookmark.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-error-500 transition-opacity"
                  title="Remove bookmark"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {effectiveBookmarks.length > 8 && (
        <button className="w-full mt-3 text-center text-sm text-brand-500 hover:text-brand-600 font-medium py-1 transition-colors">
          View all {effectiveBookmarks.length} bookmarks
        </button>
      )}
    </div>
  );
};
