"use client";

import React from "react";
import Link from "next/link";

const events = [
  {
    id: 1,
    title: "Tech Summit 2024",
    date: "Mar 15",
    time: "9:00 AM",
    client: "TechCorp",
    status: "confirmed",
    icon: "💻",
  },
  {
    id: 2,
    title: "Annual Gala Dinner",
    date: "Mar 22",
    time: "7:00 PM",
    client: "Luxury Events Co",
    status: "planning",
    icon: "🎉",
  },
  {
    id: 3,
    title: "Product Launch",
    date: "Mar 28",
    time: "2:00 PM",
    client: "StartupXYZ",
    status: "confirmed",
    icon: "🚀",
  },
  {
    id: 4,
    title: "Workshop Series",
    date: "Apr 5",
    time: "10:00 AM",
    client: "EduTech Inc",
    status: "planning",
    icon: "📚",
  },
];

const statusStyles = {
  confirmed: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  planning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function UpcomingEvents() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Events
        </h3>
        <Link
          href="/dashboard/events"
          className="text-sm text-brand-500 hover:text-brand-600 font-medium"
        >
          View all
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => (
          <div
            key={event.id}
            className={`flex gap-4 ${
              index !== events.length - 1
                ? "pb-4 border-b border-gray-100 dark:border-gray-800"
                : ""
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl dark:bg-gray-800">
              {event.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {event.title}
                </p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    statusStyles[event.status as keyof typeof statusStyles]
                  }`}
                >
                  {event.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {event.client}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {event.date}
              </p>
              <p className="text-xs text-gray-400">{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
