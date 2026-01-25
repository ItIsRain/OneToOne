"use client";
import React, { useState } from "react";
import { LogTimeModal } from "@/components/agency/modals";

const timeEntries = [
  { id: 1, member: "Alex Johnson", project: "Website Redesign", task: "Design Review", hours: 4, date: "Jan 25, 2025" },
  { id: 2, member: "Sarah Williams", project: "Mobile App", task: "UI Design", hours: 6, date: "Jan 25, 2025" },
  { id: 3, member: "Michael Chen", project: "E-commerce Platform", task: "API Development", hours: 8, date: "Jan 25, 2025" },
  { id: 4, member: "James Wilson", project: "Marketing Campaign", task: "Content Creation", hours: 5, date: "Jan 25, 2025" },
  { id: 5, member: "Lisa Thompson", project: "Annual Gala", task: "Vendor Coordination", hours: 3, date: "Jan 25, 2025" },
];

const weeklyStats = [
  { day: "Mon", hours: 32 },
  { day: "Tue", hours: 35 },
  { day: "Wed", hours: 28 },
  { day: "Thu", hours: 40 },
  { day: "Fri", hours: 26 },
];

export default function TimeTrackingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Time Tracking</h1>
            <p className="text-gray-500 dark:text-gray-400">Track team hours and productivity</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Log Time
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">Today</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">26 hrs</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">This Week</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">161 hrs</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">This Month</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">580 hrs</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Weekly Overview</h3>
          <div className="flex items-end gap-4 h-40">
            {weeklyStats.map((stat) => (
              <div key={stat.day} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-brand-500 rounded-t-lg"
                  style={{ height: `${(stat.hours / 40) * 100}%` }}
                />
                <span className="text-xs text-gray-500">{stat.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Recent Time Entries</h3>
          <div className="space-y-4">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">{entry.member}</p>
                  <p className="text-sm text-gray-500">{entry.project} • {entry.task}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800 dark:text-white/90">{entry.hours}h</p>
                  <p className="text-xs text-gray-500">{entry.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LogTimeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
