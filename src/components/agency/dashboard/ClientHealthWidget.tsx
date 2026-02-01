"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreBreakdown {
  payment: number;
  project: number;
  communication: number;
  contract: number;
  invoice: number;
}

interface ClientHealthData {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  healthScore: number;
  scoreBreakdown: ScoreBreakdown;
  trend: "up" | "down" | "stable";
  riskLevel: "healthy" | "at_risk" | "critical";
  lastActivity: string | null;
  overdueInvoices: number;
  activeProjects: number;
  alerts: string[];
}

interface HealthSummary {
  total: number;
  healthy: number;
  atRisk: number;
  critical: number;
  averageScore: number;
}

interface HealthResponse {
  summary: HealthSummary;
  clients: ClientHealthData[];
}

const riskColors: Record<string, string> = {
  healthy: "#22c55e",
  at_risk: "#f59e0b",
  critical: "#ef4444",
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

function HealthRing({ score, riskLevel }: { score: number; riskLevel: string }) {
  const color = riskColors[riskLevel] || "#6b7280";
  return (
    <svg viewBox="0 0 36 36" className="w-12 h-12 flex-shrink-0">
      <path
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="3"
      />
      <path
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${score}, 100`}
        strokeLinecap="round"
      />
      <text
        x="18"
        y="20.5"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

function BreakdownBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 dark:text-gray-400 w-20 text-right truncate">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] text-gray-500 dark:text-gray-400 w-6">{value}</span>
    </div>
  );
}

function ClientCard({ client }: { client: ClientHealthData }) {
  const [expanded, setExpanded] = useState(false);
  const color = riskColors[client.riskLevel] || "#6b7280";

  const breakdownItems = [
    { label: "Payment", value: client.scoreBreakdown.payment },
    { label: "Projects", value: client.scoreBreakdown.project },
    { label: "Communication", value: client.scoreBreakdown.communication },
    { label: "Contract", value: client.scoreBreakdown.contract },
    { label: "Invoices", value: client.scoreBreakdown.invoice },
  ];

  return (
    <motion.div
      variants={item}
      className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-default border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center gap-3">
        {/* Left: name + company */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {client.name}
          </p>
          {client.company && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {client.company}
            </p>
          )}
        </div>

        {/* Center: health ring */}
        <HealthRing score={client.healthScore} riskLevel={client.riskLevel} />

        {/* Right: trend + alerts */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Trend arrow */}
          {client.trend === "up" && (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
          {client.trend === "down" && (
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {client.trend === "stable" && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          )}

          {/* Alert count badge */}
          {client.alerts.length > 0 && (
            <span
              className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-bold rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              {client.alerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Expanded breakdown on hover */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
              {breakdownItems.map((bi) => (
                <BreakdownBar
                  key={bi.label}
                  label={bi.label}
                  value={bi.value}
                  color={color}
                />
              ))}
              {client.alerts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {client.alerts.map((alert, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-md"
                      style={{
                        color: color,
                        backgroundColor:
                          client.riskLevel === "healthy"
                            ? "rgba(34,197,94,0.1)"
                            : client.riskLevel === "at_risk"
                            ? "rgba(245,158,11,0.1)"
                            : "rgba(239,68,68,0.1)",
                      }}
                    >
                      {alert}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ClientHealthWidget() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/dashboard/client-health");

      if (!res.ok) {
        if (
          res.status === 401 ||
          res.headers.get("content-type")?.includes("text/html")
        ) {
          throw new Error("Session expired. Please refresh the page.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as Record<string, string>).error || "Failed to fetch client health"
        );
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
        <div className="flex items-center gap-2 mb-4 animate-pulse">
          <div className="h-5 w-5 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-5 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="flex gap-2 mb-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-7 w-20 rounded-full bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-20 bg-gray-50 dark:bg-gray-800/50 rounded" />
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
        <p className="text-error-600 dark:text-error-400">{error}</p>
        <button
          onClick={fetchHealth}
          className="mt-2 text-sm text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, clients } = data;

  // Empty state
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-brand-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Client Health
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          No clients yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-brand-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">
          Client Health
        </h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          Avg: {summary.averageScore}
        </span>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Total: {summary.total}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Healthy: {summary.healthy}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          At Risk: {summary.atRisk}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Critical: {summary.critical}
        </span>
      </div>

      {/* Client list */}
      <motion.div
        className="space-y-1 max-h-[400px] overflow-y-auto pr-1"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </motion.div>
    </div>
  );
}
