"use client";
import React from "react";

const timelineItems = [
  { id: 1, project: "Website Redesign", milestone: "Discovery Phase", date: "Jan 1 - Jan 15", status: "completed" },
  { id: 2, project: "Website Redesign", milestone: "Design Phase", date: "Jan 16 - Feb 5", status: "completed" },
  { id: 3, project: "Website Redesign", milestone: "Development", date: "Feb 6 - Mar 1", status: "current" },
  { id: 4, project: "Website Redesign", milestone: "Testing & QA", date: "Mar 2 - Mar 15", status: "upcoming" },
  { id: 5, project: "Mobile App", milestone: "Planning", date: "Jan 10 - Jan 20", status: "completed" },
  { id: 6, project: "Mobile App", milestone: "UI/UX Design", date: "Jan 21 - Feb 10", status: "current" },
  { id: 7, project: "Mobile App", milestone: "Development", date: "Feb 11 - Apr 1", status: "upcoming" },
];

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Project Timeline</h1>
        <p className="text-gray-500 dark:text-gray-400">View milestones across all projects</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="space-y-6">
          {timelineItems.map((item, index) => (
            <div key={item.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full ${
                  item.status === "completed" ? "bg-success-500" :
                  item.status === "current" ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                }`} />
                {index < timelineItems.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-2" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white/90">{item.milestone}</h4>
                    <p className="text-sm text-gray-500">{item.project}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === "completed" ? "bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400" :
                    item.status === "current" ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {item.status === "completed" ? "Completed" : item.status === "current" ? "In Progress" : "Upcoming"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
