"use client";
import React from "react";
import { FeatureGate } from "@/components/ui/FeatureGate";

const teamPerformance = [
  { name: "Alex Johnson", role: "Project Manager", tasks: 45, completed: 42, hours: 168, rating: 4.9 },
  { name: "Sarah Williams", role: "Senior Designer", tasks: 38, completed: 35, hours: 156, rating: 4.8 },
  { name: "Michael Chen", role: "Developer", tasks: 52, completed: 48, hours: 172, rating: 4.7 },
  { name: "James Wilson", role: "Marketing Specialist", tasks: 28, completed: 26, hours: 144, rating: 4.6 },
  { name: "Lisa Thompson", role: "Event Coordinator", tasks: 35, completed: 33, hours: 152, rating: 4.8 },
];

export default function TeamReportsPage() {
  return (
    <FeatureGate feature="advanced_analytics">
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Team Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">Team productivity and performance metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Total Hours</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">792 hrs</h3>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Tasks Completed</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">184</h3>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <h3 className="text-2xl font-bold text-success-500 mt-1">93%</h3>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">4.76 ★</h3>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Team Performance</h3>
        <div className="space-y-4">
          {teamPerformance.map((member) => {
            const completionRate = (member.completed / member.tasks * 100).toFixed(0);
            return (
              <div key={member.name} className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 dark:text-white/90">{member.name}</h4>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
                <div className="text-center px-4">
                  <p className="font-semibold text-gray-800 dark:text-white/90">{member.completed}/{member.tasks}</p>
                  <p className="text-xs text-gray-500">Tasks</p>
                </div>
                <div className="text-center px-4">
                  <p className="font-semibold text-gray-800 dark:text-white/90">{member.hours}h</p>
                  <p className="text-xs text-gray-500">Hours</p>
                </div>
                <div className="text-center px-4">
                  <p className="font-semibold text-success-500">{completionRate}%</p>
                  <p className="text-xs text-gray-500">Complete</p>
                </div>
                <div className="text-center px-4">
                  <p className="font-semibold text-yellow-500">★ {member.rating}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
