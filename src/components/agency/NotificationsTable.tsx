"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

export interface Notification {
  id: string;
  type: "task" | "payment" | "event" | "comment" | "client" | "document" | "system" | "reminder";
  title: string;
  message: string;
  time: string;
  date: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "task",
    title: "Task assigned to you",
    message: "Alex assigned you to 'Review project proposal'",
    time: "5 minutes ago",
    date: "Today",
    read: false,
    actionUrl: "/dashboard/projects",
    actionLabel: "View Task",
  },
  {
    id: "2",
    type: "payment",
    title: "Payment received",
    message: "Acme Corporation paid invoice #1024 ($4,500)",
    time: "1 hour ago",
    date: "Today",
    read: false,
    actionUrl: "/dashboard/finance/invoices",
    actionLabel: "View Invoice",
  },
  {
    id: "3",
    type: "event",
    title: "Event reminder",
    message: "Product Launch event starts in 2 days",
    time: "2 hours ago",
    date: "Today",
    read: false,
    actionUrl: "/dashboard/events",
    actionLabel: "View Event",
  },
  {
    id: "4",
    type: "comment",
    title: "New comment",
    message: "Sarah commented on 'Website Redesign' project",
    time: "3 hours ago",
    date: "Today",
    read: true,
    actionUrl: "/dashboard/projects",
    actionLabel: "View Comment",
  },
  {
    id: "5",
    type: "client",
    title: "New client added",
    message: "Lisa added 'Innovate Co.' as a new client",
    time: "5 hours ago",
    date: "Today",
    read: true,
    actionUrl: "/dashboard/crm/clients",
    actionLabel: "View Client",
  },
  {
    id: "6",
    type: "document",
    title: "Document shared",
    message: "Michael shared 'Q4 Report.pdf' with you",
    time: "10:30 AM",
    date: "Yesterday",
    read: true,
    actionUrl: "/dashboard/documents",
    actionLabel: "View Document",
  },
  {
    id: "7",
    type: "system",
    title: "System update",
    message: "New features have been added to your dashboard",
    time: "9:00 AM",
    date: "Yesterday",
    read: true,
  },
  {
    id: "8",
    type: "reminder",
    title: "Meeting reminder",
    message: "Team standup meeting in 30 minutes",
    time: "8:30 AM",
    date: "Yesterday",
    read: true,
  },
];

const typeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  task: { icon: "📋", color: "primary", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  payment: { icon: "💰", color: "success", bgColor: "bg-green-100 dark:bg-green-900/30" },
  event: { icon: "📅", color: "warning", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  comment: { icon: "💬", color: "primary", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  client: { icon: "👤", color: "success", bgColor: "bg-green-100 dark:bg-green-900/30" },
  document: { icon: "📄", color: "light", bgColor: "bg-gray-100 dark:bg-gray-800" },
  system: { icon: "⚙️", color: "light", bgColor: "bg-gray-100 dark:bg-gray-800" },
  reminder: { icon: "🔔", color: "warning", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
};

export const NotificationsTable = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
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

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Notifications
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {notifications.length} notifications • {unreadCount} unread
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
                        <span className="block">{notification.time}</span>
                        <span className="text-theme-xs">{notification.date}</span>
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
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="text-brand-500 hover:text-brand-600"
                          >
                            {notification.actionLabel || "View"}
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
