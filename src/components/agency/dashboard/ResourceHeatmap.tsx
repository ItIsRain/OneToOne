"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { SessionExpiredError } from "@/lib/fetch";

interface TaskInfo {
  id: string;
  title: string;
  priority: string;
}

interface WeekData {
  taskCount: number;
  utilization: number;
  tasks: TaskInfo[];
}

interface MemberData {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  weeks: WeekData[];
  averageUtilization: number;
}

interface HeatmapData {
  weeks: string[];
  weekRanges: { start: string; end: string }[];
  members: MemberData[];
  summary: {
    weekAverages: number[];
    overbooked: number;
    available: number;
  };
}

function getUtilizationStyle(utilization: number) {
  if (utilization === 0) {
    return {
      bg: "bg-gray-50 dark:bg-gray-800/50",
      text: "text-gray-400",
    };
  }
  if (utilization <= 40) {
    return {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  }
  if (utilization <= 70) {
    return {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
    };
  }
  if (utilization <= 90) {
    return {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-700 dark:text-orange-400",
    };
  }
  return {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const cellVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 },
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

function TooltipCell({
  week,
  memberName,
  weekLabel,
}: {
  week: WeekData;
  memberName: string;
  weekLabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  const style = getUtilizationStyle(week.utilization);

  return (
    <motion.td
      variants={cellVariants}
      className="p-1.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative rounded-lg px-3 py-2.5 text-center font-semibold text-sm ${style.bg} ${style.text} transition-colors`}>
        {week.utilization}%

        {hovered && (
          <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs p-3 shadow-lg pointer-events-none">
            <p className="font-medium mb-1">{memberName} - {weekLabel}</p>
            <p className="text-gray-300 mb-1.5">
              {week.taskCount} task{week.taskCount !== 1 ? "s" : ""} ({week.utilization}% capacity)
            </p>
            {week.tasks.length > 0 && (
              <ul className="space-y-0.5">
                {week.tasks.slice(0, 3).map((task) => (
                  <li key={task.id} className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        task.priority === "urgent" || task.priority === "high"
                          ? "bg-red-400"
                          : task.priority === "medium"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span className="truncate">{task.title}</span>
                  </li>
                ))}
                {week.tasks.length > 3 && (
                  <li className="text-gray-400">+{week.tasks.length - 3} more</li>
                )}
              </ul>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 transform" />
            </div>
          </div>
        )}
      </div>
    </motion.td>
  );
}

export function ResourceHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/resource-heatmap");
      if (!res.ok) {
        if (res.status === 401 || res.headers.get("content-type")?.includes("text/html")) {
          throw new SessionExpiredError();
        }
        const json = await res.json().catch(() => ({}));
        throw new Error((json as Record<string, string>).error || "Failed to fetch data");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-5 w-5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <div className="h-5 w-32 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="flex gap-2 mb-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-20 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="flex gap-3 items-center">
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
              <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="flex-1 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((col) => (
                  <div key={col} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-sm text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const busyCount = data.members.filter(
    (m) => m.averageUtilization > 40 && m.averageUtilization <= 90
  ).length;

  return (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Team Capacity
          </h3>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {data.summary.available} available
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {busyCount} busy
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {data.summary.overbooked} overbooked
        </span>
      </div>

      {/* Heatmap table */}
      {data.members.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
          No team members found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <motion.table
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-3 pr-4 w-44">
                  Team Member
                </th>
                {data.weeks.map((week) => (
                  <th
                    key={week}
                    className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-3 px-1.5"
                  >
                    {week}
                  </th>
                ))}
                <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-3 pl-3 w-16">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((member) => {
                const avgStyle = getUtilizationStyle(member.averageUtilization);
                return (
                  <tr key={member.id} className="group">
                    <td className="pr-4 py-1.5">
                      <div className="flex items-center gap-2.5">
                        {member.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate capitalize">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    {member.weeks.map((week, weekIndex) => (
                      <TooltipCell
                        key={weekIndex}
                        week={week}
                        memberName={member.name}
                        weekLabel={data.weeks[weekIndex]}
                      />
                    ))}
                    <motion.td variants={cellVariants} className="pl-3 py-1.5">
                      <div
                        className={`rounded-lg px-2 py-2.5 text-center font-semibold text-xs ${avgStyle.bg} ${avgStyle.text}`}
                      >
                        {member.averageUtilization}%
                      </div>
                    </motion.td>
                  </tr>
                );
              })}
            </tbody>
          </motion.table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400">Capacity:</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" />
            <span className="text-xs text-gray-400">0%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30" />
            <span className="text-xs text-gray-400">1-40%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30" />
            <span className="text-xs text-gray-400">41-70%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30" />
            <span className="text-xs text-gray-400">71-90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" />
            <span className="text-xs text-gray-400">91-100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
