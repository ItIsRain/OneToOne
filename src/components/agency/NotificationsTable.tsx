"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

export interface Notification {
  id: string;
  type: "task" | "payment" | "event" | "workflow" | "approval" | "system";
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  action_label?: string;
  created_at: string;
}

const typeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  task: { icon: "\u{1F4CB}", color: "primary", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  payment: { icon: "\u{1F4B0}", color: "success", bgColor: "bg-green-100 dark:bg-green-900/30" },
  event: { icon: "\u{1F4C5}", color: "warning", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  workflow: { icon: "\u{26A1}", color: "primary", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  approval: { icon: "\u{2705}", color: "success", bgColor: "bg-lime-100 dark:bg-lime-900/30" },
  system: { icon: "\u{2699}\u{FE0F}", color: "light", bgColor: "bg-gray-100 dark:bg-gray-800" },
};

function timeAgo(dateStr: string): { time: string; date: string } {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  let time: string;
  if (diffMin < 1) time = "Just now";
  else if (diffMin < 60) time = `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  else if (diffHr < 24) time = `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  else time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let date: string;
  if (diffDay === 0) date = "Today";
  else if (diffDay === 1) date = "Yesterday";
  else date = d.toLocaleDateString();

  return { time, date };
}

export const NotificationsTable = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const readParam = filter === "unread" ? "&read=false" : "";
      const res = await fetch(`/api/notifications?limit=50${readParam}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleMarkAsRead = async (id: string) => {
    setNotifications(notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    if (!confirm("Are you sure you want to clear all notifications?")) {
      return;
    }
    setNotifications([]);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Notifications
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {notifications.length} notifications {unreadCount > 0 && `\u2022 ${unreadCount} unread`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === "all"
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === "unread"
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No notifications
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filter === "unread" ? "No unread notifications." : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Type
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Notification
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Time
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredNotifications.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.system;
                const { time, date } = timeAgo(notification.created_at);
                return (
                  <TableRow key={notification.id} className={!notification.read ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                        )}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${config.bgColor}`}>
                          {config.icon}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <h4 className={`text-theme-sm ${!notification.read ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                          {notification.title}
                        </h4>
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div>
                        <span className="block">{time}</span>
                        <span className="text-theme-xs">{date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Mark read
                          </button>
                        )}
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            className="text-brand-500 hover:text-brand-600"
                          >
                            {notification.action_label || "View"}
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-error-500 hover:text-error-600"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
