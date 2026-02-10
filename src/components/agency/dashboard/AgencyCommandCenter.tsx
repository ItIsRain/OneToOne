"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useCountUp } from "@/hooks/useCountUp";
import { fetchWithRetry } from "@/lib/fetch";
import {
  CloseIcon,
  DollarLineIcon,
  GroupIcon,
  BoxCubeIcon,
  TaskIcon,
} from "@/icons";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ---- Types ----

interface RevenueChart {
  month: string;
  revenue: number;
}

interface Pipeline {
  new: number;
  contacted: number;
  qualified: number;
  proposal: number;
  won: number;
}

interface ProjectStatus {
  active: number;
  completed: number;
  onHold: number;
  planning: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  activeTasks: number;
  totalAssigned: number;
  utilization: number;
}

interface Deadline {
  id: string;
  type: "task" | "event";
  title: string;
  time: string | null;
  priority: string | null;
  status: string;
}

interface CommandCenterData {
  revenue: { thisMonth: number; chart: RevenueChart[] };
  clients: { active: number; total: number };
  pipeline: Pipeline;
  projects: { total: number; status: ProjectStatus };
  tasks: { pending: number; overdue: number; total: number };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalOutstanding: number;
  };
  teamUtilization: TeamMember[];
  todayDeadlines: Deadline[];
  teamCount: number;
}

interface AgencyCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---- Animation variants ----

const overlayVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// ---- Animated Number ----

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const animated = useCountUp(value, 1200, decimals);
  const formatted =
    decimals > 0
      ? animated.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : animated.toLocaleString("en-US");
  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
}

// ---- Glassmorphism card wrapper ----

function GlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 ${
        glow ? "shadow-[0_0_30px_rgba(111,191,0,0.15)]" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ---- Skeleton Loader ----

function CommandCenterSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Top row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
          >
            <div className="h-4 w-20 bg-white/10 rounded mb-3" />
            <div className="h-8 w-28 bg-white/10 rounded mb-2" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
      {/* Middle row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 h-64"
          />
        ))}
      </div>
      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 h-48"
          />
        ))}
      </div>
    </div>
  );
}

// ---- Main Component ----

export const AgencyCommandCenter: React.FC<AgencyCommandCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await fetchWithRetry<CommandCenterData>("/api/dashboard/command-center");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[99999] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-y-auto"
          variants={overlayVariants}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                Command Center
              </h1>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Close Command Center"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <CommandCenterSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <p className="text-red-400 text-lg">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : data ? (
            <motion.div
              className="p-6 space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {/* Top Row: 4 big metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard glow>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15">
                      <DollarLineIcon className="size-5 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">
                      Revenue
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    <AnimatedNumber
                      value={data.revenue.thisMonth}
                      prefix="$"
                      decimals={2}
                    />
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </GlassCard>

                <GlassCard glow>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/15">
                      <GroupIcon className="size-5 text-brand-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">
                      Active Clients
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    <AnimatedNumber value={data.clients.active} />
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    of {data.clients.total} total
                  </p>
                </GlassCard>

                <GlassCard glow>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/15">
                      <BoxCubeIcon className="size-5 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">
                      Projects
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    <AnimatedNumber value={data.projects.total} />
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.projects.status.active} active
                  </p>
                </GlassCard>

                <GlassCard glow>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15">
                      <TaskIcon className="size-5 text-amber-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">
                      Pending Tasks
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    <AnimatedNumber value={data.tasks.pending} />
                  </h2>
                  <p className="text-xs text-red-400 mt-1">
                    {data.tasks.overdue} overdue
                  </p>
                </GlassCard>
              </div>

              {/* Middle Row: Revenue chart, Pipeline funnel, Project donut */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Sparkline */}
                <GlassCard className="lg:col-span-1">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Revenue Trend
                  </h3>
                  <div className="h-48">
                    <Chart
                      type="area"
                      height="100%"
                      width="100%"
                      series={[
                        {
                          name: "Revenue",
                          data: data.revenue.chart.map((c) => c.revenue),
                        },
                      ]}
                      options={{
                        chart: {
                          sparkline: { enabled: false },
                          toolbar: { show: false },
                          background: "transparent",
                          fontFamily: "inherit",
                        },
                        xaxis: {
                          categories: data.revenue.chart.map((c) => c.month),
                          labels: { style: { colors: "#9ca3af", fontSize: "11px" } },
                          axisBorder: { show: false },
                          axisTicks: { show: false },
                        },
                        yaxis: {
                          labels: {
                            style: { colors: "#9ca3af", fontSize: "11px" },
                            formatter: (val: number) =>
                              val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val}`,
                          },
                        },
                        grid: {
                          borderColor: "rgba(255,255,255,0.05)",
                          strokeDashArray: 3,
                          padding: { left: 0, right: 0, top: 0, bottom: 0 },
                        },
                        stroke: { curve: "smooth", width: 2 },
                        fill: {
                          type: "gradient",
                          gradient: {
                            shadeIntensity: 1,
                            opacityFrom: 0.4,
                            opacityTo: 0,
                            stops: [0, 100],
                          },
                        },
                        colors: ["#6fbf00"],
                        tooltip: {
                          theme: "dark",
                          y: {
                            formatter: (val: number) => `$${val.toLocaleString()}`,
                          },
                        },
                        dataLabels: { enabled: false },
                      }}
                    />
                  </div>
                </GlassCard>

                {/* Pipeline Funnel */}
                <GlassCard className="lg:col-span-1">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">
                    Pipeline Funnel
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "New", value: data.pipeline.new, width: "100%", color: "from-brand-400 to-brand-500" },
                      { label: "Contacted", value: data.pipeline.contacted, width: "80%", color: "from-brand-500 to-emerald-500" },
                      { label: "Qualified", value: data.pipeline.qualified, width: "60%", color: "from-emerald-500 to-teal-500" },
                      { label: "Proposal", value: data.pipeline.proposal, width: "40%", color: "from-teal-500 to-cyan-500" },
                      { label: "Won", value: data.pipeline.won, width: "20%", color: "from-cyan-500 to-blue-500" },
                    ].map((stage) => (
                      <div key={stage.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">{stage.label}</span>
                          <span className="text-xs font-semibold text-white">
                            {stage.value}
                          </span>
                        </div>
                        <div
                          className="h-6 rounded-lg overflow-hidden"
                          style={{ width: stage.width }}
                        >
                          <div
                            className={`h-full w-full bg-gradient-to-r ${stage.color} rounded-lg`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Project Status Donut */}
                <GlassCard className="lg:col-span-1">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">
                    Project Status
                  </h3>
                  <div className="h-48">
                    <Chart
                      type="donut"
                      height="100%"
                      width="100%"
                      series={[
                        data.projects.status.active,
                        data.projects.status.completed,
                        data.projects.status.onHold,
                        data.projects.status.planning,
                      ]}
                      options={{
                        chart: { background: "transparent", fontFamily: "inherit" },
                        labels: ["Active", "Completed", "On Hold", "Planning"],
                        colors: ["#6fbf00", "#10b981", "#f59e0b", "#6b7280"],
                        legend: {
                          position: "bottom",
                          labels: { colors: "#9ca3af" },
                          fontSize: "12px",
                          fontFamily: "inherit",
                        },
                        dataLabels: {
                          enabled: true,
                          style: {
                            fontSize: "11px",
                            fontFamily: "inherit",
                            fontWeight: 600,
                          },
                        },
                        stroke: { show: false },
                        plotOptions: {
                          pie: {
                            donut: {
                              size: "65%",
                              labels: {
                                show: true,
                                total: {
                                  show: true,
                                  label: "Total",
                                  color: "#9ca3af",
                                  fontSize: "12px",
                                  fontFamily: "inherit",
                                  formatter: () =>
                                    String(data.projects.total),
                                },
                                value: {
                                  color: "#ffffff",
                                  fontSize: "18px",
                                  fontFamily: "inherit",
                                  fontWeight: 700,
                                },
                              },
                            },
                          },
                        },
                        tooltip: { theme: "dark" },
                      }}
                    />
                  </div>
                </GlassCard>
              </div>

              {/* Bottom Row: Team utilization + Today's deadlines */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Team Utilization */}
                <GlassCard>
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">
                    Team Utilization
                  </h3>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {data.teamUtilization.length === 0 ? (
                      <p className="text-xs text-gray-500">No team members found.</p>
                    ) : (
                      data.teamUtilization.map((member) => {
                        const barColor =
                          member.utilization > 90
                            ? "bg-red-500"
                            : member.utilization > 70
                            ? "bg-amber-500"
                            : "bg-emerald-500";
                        return (
                          <div key={member.id} className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-gray-400">
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            {/* Info + bar */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-300 truncate">
                                  {member.name}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {member.utilization}%
                                </span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${barColor} rounded-full transition-all duration-700`}
                                  style={{ width: `${member.utilization}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </GlassCard>

                {/* Today's Deadlines */}
                <GlassCard>
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">
                    Today&apos;s Deadlines
                  </h3>
                  {data.todayDeadlines.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No deadlines for today. You&apos;re all clear!
                    </p>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                      {data.todayDeadlines.map((item) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-48 bg-white/5 border border-white/5 rounded-xl p-3 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                                item.type === "task"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-purple-500/20 text-purple-400"
                              }`}
                            >
                              {item.type}
                            </span>
                            {item.priority && (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                                  item.priority === "urgent" || item.priority === "high"
                                    ? "bg-red-500/20 text-red-400"
                                    : item.priority === "medium"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}
                              >
                                {item.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed">
                            {item.title}
                          </p>
                          {item.time && (
                            <p className="text-[10px] text-gray-500">
                              {new Date(item.time).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Footer stats bar */}
              <GlassCard className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <span>
                    <span className="text-gray-300 font-semibold">{data.teamCount}</span> team members
                  </span>
                  <span>
                    <span className="text-gray-300 font-semibold">{data.invoices.paid}</span> invoices paid
                  </span>
                  <span>
                    <span className="text-gray-300 font-semibold">${data.invoices.totalOutstanding.toLocaleString()}</span> outstanding
                  </span>
                </div>
                <span className="text-[10px] text-gray-600">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </GlassCard>
            </motion.div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
