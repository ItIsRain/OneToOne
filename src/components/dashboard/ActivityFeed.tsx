"use client";

import React from "react";

const activities = [
  {
    id: 1,
    type: "client",
    title: "New client added",
    description: "Acme Corporation was added to your clients",
    time: "2 hours ago",
    icon: "👤",
  },
  {
    id: 2,
    type: "event",
    title: "Event scheduled",
    description: "Tech Summit 2024 has been scheduled for March 15",
    time: "4 hours ago",
    icon: "📅",
  },
  {
    id: 3,
    type: "invoice",
    title: "Invoice paid",
    description: "Invoice #1234 from Startup Inc was paid",
    time: "Yesterday",
    icon: "💰",
  },
  {
    id: 4,
    type: "task",
    title: "Task completed",
    description: "Venue booking confirmed for Annual Gala",
    time: "Yesterday",
    icon: "✅",
  },
  {
    id: 5,
    type: "client",
    title: "Contract signed",
    description: "GlobalTech signed a 1-year contract",
    time: "2 days ago",
    icon: "📝",
  },
];

export function ActivityFeed() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <button className="text-sm text-brand-500 hover:text-brand-600 font-medium">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex gap-4 ${
              index !== activities.length - 1
                ? "pb-4 border-b border-gray-100 dark:border-gray-800"
                : ""
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-lg dark:bg-gray-800">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
