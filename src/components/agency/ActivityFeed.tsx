"use client";
import React from "react";

interface Activity {
  id: number;
  type: "client" | "event" | "task" | "invoice";
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: 1,
    type: "client",
    title: "New client added",
    description: "Acme Corporation was added to the client list",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "event",
    title: "Event completed",
    description: "Product Launch - TechStart Inc.",
    time: "4 hours ago",
  },
  {
    id: 3,
    type: "task",
    title: "Task completed",
    description: "Design mockups for Summit Conference",
    time: "Yesterday",
  },
  {
    id: 4,
    type: "invoice",
    title: "Invoice paid",
    description: "Invoice #1024 - $4,500 from GlobalTech",
    time: "Yesterday",
  },
  {
    id: 5,
    type: "event",
    title: "Event scheduled",
    description: "Annual Gala - Metro Events",
    time: "2 days ago",
  },
];

const typeColors = {
  client: "bg-brand-500",
  event: "bg-warning-500",
  task: "bg-success-500",
  invoice: "bg-blue-light-500",
};

export const ActivityFeed = () => {
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

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4">
            <div className="relative flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${typeColors[activity.type]}`}
              />
              {activity.id !== activities.length && (
                <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {activity.title}
              </p>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                {activity.description}
              </p>
              <span className="text-gray-400 text-theme-xs dark:text-gray-500">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
