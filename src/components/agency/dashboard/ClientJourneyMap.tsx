"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

// ---------- Types ----------

interface JourneyClient {
  id: string;
  name: string;
  company: string | null;
  status: string;
  created_at: string;
}

interface Milestone {
  id: string;
  type: string;
  title: string;
  date: string;
  amount: number | null;
  metadata: Record<string, unknown> | null;
}

interface Phase {
  start: string | null;
  end: string | null;
}

interface JourneyData {
  client: JourneyClient;
  totalRevenue: number;
  phases: {
    acquisition: Phase;
    onboarding: Phase;
    active: Phase;
    retention: Phase;
  };
  milestones: Milestone[];
  cumulativeRevenue: { date: string; total: number }[];
  counts: {
    invoices: number;
    projects: number;
    proposals: number;
    contracts: number;
    payments: number;
  };
}

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

// ---------- Icon components ----------

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

// ---------- Helpers ----------

const milestoneColors: Record<string, string> = {
  client_created: "bg-blue-500",
  proposal_sent: "bg-purple-500",
  proposal_accepted: "bg-purple-500",
  contract_signed: "bg-indigo-500",
  project_started: "bg-emerald-500",
  project_completed: "bg-emerald-500",
  invoice_sent: "bg-amber-500",
  payment_received: "bg-emerald-600",
};

function getMilestoneIcon(type: string) {
  switch (type) {
    case "client_created":
      return <UserIcon />;
    case "proposal_sent":
    case "proposal_accepted":
      return <DocumentIcon />;
    case "contract_signed":
      return <PenIcon />;
    case "project_started":
    case "project_completed":
      return <RocketIcon />;
    case "invoice_sent":
      return <FileIcon />;
    case "payment_received":
      return <DollarIcon />;
    default:
      return <FileIcon />;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthsBetween(d1: string, d2: Date): number {
  const start = new Date(d1);
  const diffMs = d2.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)));
}

// ---------- Skeleton ----------

function JourneySkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ---------- Phase Bar ----------

function PhaseBar({ phases }: { phases: JourneyData["phases"] }) {
  const phaseList = [
    { key: "acquisition", label: "Acquisition", color: "bg-blue-500", data: phases.acquisition },
    { key: "onboarding", label: "Onboarding", color: "bg-purple-500", data: phases.onboarding },
    { key: "active", label: "Active", color: "bg-emerald-500", data: phases.active },
    { key: "retention", label: "Retention", color: "bg-amber-500", data: phases.retention },
  ];

  // Calculate durations for proportional widths
  const now = new Date();
  const durations = phaseList.map((phase) => {
    if (!phase.data.start) return 0;
    const start = new Date(phase.data.start);
    const end = phase.data.end ? new Date(phase.data.end) : now;
    return Math.max(1, end.getTime() - start.getTime());
  });

  const totalDuration = durations.reduce((sum, d) => sum + d, 0);
  const activePhases = durations.filter((d) => d > 0).length;

  return (
    <div className="space-y-2">
      <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {phaseList.map((phase, i) => {
          if (durations[i] === 0) return null;
          const widthPercent =
            totalDuration > 0
              ? Math.max(10, (durations[i] / totalDuration) * 100)
              : activePhases > 0
              ? 100 / activePhases
              : 25;
          return (
            <div
              key={phase.key}
              className={`${phase.color} transition-all duration-500`}
              style={{ width: `${widthPercent}%` }}
              title={phase.label}
            />
          );
        })}
      </div>
      <div className="flex gap-4 flex-wrap">
        {phaseList.map((phase) => (
          <div key={phase.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${phase.color} ${!phase.data.start ? "opacity-30" : ""}`} />
            <span className={`text-xs font-medium ${!phase.data.start ? "text-gray-400 dark:text-gray-600" : "text-gray-600 dark:text-gray-400"}`}>
              {phase.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Main Component ----------

export function ClientJourneyMap() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch client list
  useEffect(() => {
    setClientsLoading(true);
    fetch("/api/clients")
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed to load clients")))
      .then((data) => {
        const list: ClientOption[] = (data.clients || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          company: c.company as string | null,
        }));
        setClients(list);
        if (list.length > 0 && !selectedClientId) {
          setSelectedClientId(list[0].id);
        }
      })
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch journey data when client changes
  const fetchJourney = useCallback(async (clientId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/journey`);
      if (!res.ok) throw new Error("Failed to load journey");
      const data = await res.json();
      setJourney(data);
    } catch {
      setError("Failed to load client journey. Please try again.");
      setJourney(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchJourney(selectedClientId);
    }
  }, [selectedClientId, fetchJourney]);

  const now = new Date();

  return (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <MapIcon />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Client Journey
          </h3>
        </div>

        {/* Client Selector */}
        <div className="relative">
          {clientsLoading ? (
            <div className="h-9 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <select
              value={selectedClientId || ""}
              onChange={(e) => setSelectedClientId(e.target.value || null)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[200px]"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` (${c.company})` : ""}
                </option>
              ))}
            </select>
          )}
          {/* Chevron */}
          {!clientsLoading && (
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedClientId && !clientsLoading && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <MapIcon />
          <p className="mt-2 text-sm">Select a client to view their journey</p>
        </div>
      )}

      {loading && <JourneySkeleton />}

      {error && (
        <div className="text-center py-8">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button
            onClick={() => selectedClientId && fetchJourney(selectedClientId)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && journey && (
        <div className="space-y-6">
          {/* Phase Bar */}
          <PhaseBar phases={journey.phases} />

          {/* Timeline */}
          {journey.milestones.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p className="text-sm">No journey data yet</p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto scroll-smooth pb-4"
            >
              <div
                className="relative flex items-start pt-2"
                style={{ minWidth: `${Math.max(journey.milestones.length * 130, 400)}px` }}
              >
                {/* Horizontal line */}
                <div className="absolute top-[22px] left-5 right-5 h-0.5 bg-gray-200 dark:bg-gray-700" />

                {/* Milestones */}
                {journey.milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    className="flex flex-col items-center relative"
                    style={{ minWidth: "120px", flex: "1 0 120px" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.35 }}
                  >
                    {/* Dot */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md z-10 ${
                        milestoneColors[milestone.type] || "bg-gray-400"
                      }`}
                    >
                      {getMilestoneIcon(milestone.type)}
                    </div>

                    {/* Title + Date */}
                    <div className="mt-3 text-center px-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight line-clamp-2">
                        {milestone.title}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDate(milestone.date)}
                      </p>
                      {milestone.amount != null && milestone.amount > 0 && (
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {formatCurrency(milestone.amount)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {formatCurrency(journey.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {monthsBetween(journey.client.created_at, now)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">mo</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {journey.counts.projects}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Projects</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {journey.counts.payments}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Payments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
