"use client";
import React from "react";

const notifications = [
  { id: 1, type: "task", title: "Task assigned to you", message: "Alex assigned you to 'Review project proposal'", time: "5 minutes ago", read: false },
  { id: 2, type: "payment", title: "Payment received", message: "Acme Corporation paid invoice #1024 ($4,500)", time: "1 hour ago", read: false },
  { id: 3, type: "event", title: "Event reminder", message: "Product Launch event starts in 2 days", time: "2 hours ago", read: false },
  { id: 4, type: "comment", title: "New comment", message: "Sarah commented on 'Website Redesign' project", time: "3 hours ago", read: true },
  { id: 5, type: "client", title: "New client added", message: "Lisa added 'Innovate Co.' as a new client", time: "Yesterday", read: true },
  { id: 6, type: "document", title: "Document shared", message: "Michael shared 'Q4 Report.pdf' with you", time: "Yesterday", read: true },
];

const typeIcons = {
  task: "📋",
  payment: "💰",
  event: "📅",
  comment: "💬",
  client: "👤",
  document: "📄",
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400">Stay updated on activity</p>
        </div>
        <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">
          Mark all as read
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-800/50 ${!notification.read ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl dark:bg-gray-800">
                  {typeIcons[notification.type as keyof typeof typeIcons]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm ${!notification.read ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-500">{notification.message}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
