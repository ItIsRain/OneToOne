"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

// ── Types ──────────────────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  avatar_url: string | null;
  department: string | null;
  job_title: string | null;
  employment_type: string;
  capacity_hours: number;
  status: string;
  avg_utilization: number;
}

interface Week {
  week_start: string;
  week_end: string;
}

interface UtilizationCell {
  member_id: string;
  week_start: string;
  hours_logged: number;
  hours_estimated: number;
  hours_capacity: number;
  utilization_percent: number;
  billable_hours: number;
  task_count: number;
}

interface UtilizationData {
  members: Member[];
  weeks: Week[];
  utilization: UtilizationCell[];
  stats: {
    total_members: number;
    avg_utilization: number;
    overallocated_count: number;
    underutilized_count: number;
    optimal_count: number;
  };
}

// ── Color helpers ──────────────────────────────────────────────────────────
function utilizationColor(pct: number): string {
  if (pct === 0) return "bg-gray-100 dark:bg-gray-800";
  if (pct < 40) return "bg-blue-100 dark:bg-blue-900/30";
  if (pct < 70) return "bg-emerald-200 dark:bg-emerald-900/40";
  if (pct <= 100) return "bg-emerald-400 dark:bg-emerald-700/60";
  if (pct <= 120) return "bg-amber-300 dark:bg-amber-700/50";
  return "bg-red-400 dark:bg-red-700/60";
}

function utilizationTextColor(pct: number): string {
  if (pct === 0) return "text-gray-400 dark:text-gray-500";
  if (pct < 40) return "text-blue-700 dark:text-blue-300";
  if (pct <= 100) return "text-emerald-800 dark:text-emerald-200";
  if (pct <= 120) return "text-amber-800 dark:text-amber-200";
  return "text-red-800 dark:text-red-200";
}

function utilizationLabel(pct: number): string {
  if (pct === 0) return "Idle";
  if (pct < 40) return "Light";
  if (pct < 70) return "Moderate";
  if (pct <= 100) return "Optimal";
  if (pct <= 120) return "Heavy";
  return "Overloaded";
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function avatarInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function UtilizationPage() {
  const [data, setData] = useState<UtilizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [numWeeks, setNumWeeks] = useState(8);
  const [selectedCell, setSelectedCell] = useState<{ memberId: string; weekStart: string } | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "utilization">("utilization");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/resources/utilization?weeks=${numWeeks}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load utilization data");
    } finally {
      setLoading(false);
    }
  }, [numWeeks]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <FeatureGate feature="resource_utilization">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </FeatureGate>
    );
  }

  if (error) {
    return (
      <FeatureGate feature="resource_utilization">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-error-500">{error}</p>
          <button onClick={fetchData} className="mt-2 text-brand-500 hover:text-brand-600">
            Try again
          </button>
        </div>
      </FeatureGate>
    );
  }

  if (!data || data.members.length === 0) {
    return (
      <FeatureGate feature="resource_utilization">
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No team members found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add team members and assign tasks to see utilization data.</p>
        </div>
      </FeatureGate>
    );
  }

  const { members, weeks, utilization, stats } = data;

  // Sort members
  const sortedMembers = [...members].sort((a, b) => {
    if (sortBy === "utilization") return b.avg_utilization - a.avg_utilization;
    return a.name.localeCompare(b.name);
  });

  // Get cell data helper
  const getCell = (memberId: string, weekStart: string): UtilizationCell | undefined =>
    utilization.find((u) => u.member_id === memberId && u.week_start === weekStart);

  // Selected cell details
  const selectedCellData = selectedCell
    ? getCell(selectedCell.memberId, selectedCell.weekStart)
    : null;
  const selectedMember = selectedCell
    ? members.find((m) => m.id === selectedCell.memberId)
    : null;

  // Weekly team totals
  const weeklyTotals = weeks.map((w) => {
    const cells = utilization.filter((u) => u.week_start === w.week_start);
    const totalCapacity = cells.reduce((s, c) => s + c.hours_capacity, 0);
    const totalEffective = cells.reduce((s, c) => s + Math.max(c.hours_logged, c.hours_estimated), 0);
    return {
      week_start: w.week_start,
      capacity: totalCapacity,
      booked: Math.round(totalEffective * 10) / 10,
      pct: totalCapacity > 0 ? Math.round((totalEffective / totalCapacity) * 100) : 0,
    };
  });

  return (
    <ProtectedPage permission={PERMISSIONS.TEAM_VIEW}>
    <FeatureGate feature="resource_utilization">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Resource Utilization
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Team workload and capacity across the next {numWeeks} weeks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={numWeeks}
              onChange={(e) => setNumWeeks(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value={4}>4 weeks</option>
              <option value={6}>6 weeks</option>
              <option value={8}>8 weeks</option>
              <option value={12}>12 weeks</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "utilization")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="utilization">Sort by load</option>
              <option value="name">Sort by name</option>
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            label="Team Members"
            value={stats.total_members.toString()}
            sub="Active"
            color="text-gray-900 dark:text-white"
          />
          <SummaryCard
            label="Avg Utilization"
            value={`${stats.avg_utilization}%`}
            sub={utilizationLabel(stats.avg_utilization)}
            color={stats.avg_utilization > 100 ? "text-red-500" : stats.avg_utilization >= 70 ? "text-emerald-500" : "text-amber-500"}
          />
          <SummaryCard
            label="Overloaded"
            value={stats.overallocated_count.toString()}
            sub={`> 100% capacity`}
            color={stats.overallocated_count > 0 ? "text-red-500" : "text-gray-900 dark:text-white"}
          />
          <SummaryCard
            label="Optimal Range"
            value={stats.optimal_count.toString()}
            sub="70–100% utilized"
            color="text-emerald-500"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Legend:</span>
          {[
            { label: "Idle (0%)", cls: "bg-gray-100 dark:bg-gray-700" },
            { label: "Light (<40%)", cls: "bg-blue-100 dark:bg-blue-900/40" },
            { label: "Moderate (40–69%)", cls: "bg-emerald-200 dark:bg-emerald-900/50" },
            { label: "Optimal (70–100%)", cls: "bg-emerald-400 dark:bg-emerald-700" },
            { label: "Heavy (101–120%)", cls: "bg-amber-300 dark:bg-amber-700" },
            { label: "Overloaded (>120%)", cls: "bg-red-400 dark:bg-red-700" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className={`inline-block h-3 w-3 rounded ${item.cls}`} />
              {item.label}
            </span>
          ))}
        </div>

        {/* Heatmap */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56 border-b border-gray-200 dark:border-gray-800">
                    Team Member
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16 border-b border-gray-200 dark:border-gray-800">
                    Avg
                  </th>
                  {weeks.map((w) => (
                    <th
                      key={w.week_start}
                      className="px-1 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 min-w-[72px]"
                    >
                      {formatWeek(w.week_start)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    {/* Member info */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-2.5 border-r border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-xs font-semibold text-brand-600 dark:text-brand-400">
                            {avatarInitials(member.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {member.job_title || member.department || member.employment_type}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Average badge */}
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 dark:border-gray-800">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${utilizationColor(member.avg_utilization)} ${utilizationTextColor(member.avg_utilization)}`}>
                        {member.avg_utilization}%
                      </span>
                    </td>

                    {/* Heatmap cells */}
                    {weeks.map((w) => {
                      const cell = getCell(member.id, w.week_start);
                      const pct = cell?.utilization_percent || 0;
                      const isSelected = selectedCell?.memberId === member.id && selectedCell?.weekStart === w.week_start;

                      return (
                        <td key={w.week_start} className="px-1 py-2.5">
                          <button
                            onClick={() =>
                              setSelectedCell(
                                isSelected ? null : { memberId: member.id, weekStart: w.week_start }
                              )
                            }
                            className={`w-full rounded-lg px-1.5 py-2 text-center transition-all ${utilizationColor(pct)} ${utilizationTextColor(pct)} ${
                              isSelected
                                ? "ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-gray-900"
                                : "hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600"
                            }`}
                            title={`${member.name} — Week of ${formatWeek(w.week_start)}: ${pct}% (${cell?.hours_logged || 0}h logged, ${cell?.hours_estimated || 0}h planned)`}
                          >
                            <span className="block text-sm font-bold leading-none">{pct}%</span>
                            <span className="block text-[10px] leading-none mt-0.5 opacity-70">
                              {cell ? `${Math.max(cell.hours_logged, cell.hours_estimated).toFixed(0)}h` : "0h"}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Team total row */}
                <tr className="bg-gray-50 dark:bg-gray-800/40 font-medium">
                  <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800/40 px-4 py-2.5 border-r border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team Total</span>
                  </td>
                  <td className="px-2 py-2.5 text-center border-r border-gray-100 dark:border-gray-800">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${utilizationColor(stats.avg_utilization)} ${utilizationTextColor(stats.avg_utilization)}`}>
                      {stats.avg_utilization}%
                    </span>
                  </td>
                  {weeklyTotals.map((wt) => (
                    <td key={wt.week_start} className="px-1 py-2.5 text-center">
                      <span className={`block text-sm font-bold ${utilizationTextColor(wt.pct)}`}>{wt.pct}%</span>
                      <span className="block text-[10px] text-gray-400">{wt.booked}h / {wt.capacity}h</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Drill-down panel */}
        {selectedCellData && selectedMember && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  {selectedMember.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Week of {formatWeek(selectedCell!.weekStart)} — {formatWeek(addDays(selectedCell!.weekStart, 6))}
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <DetailStat
                label="Utilization"
                value={`${selectedCellData.utilization_percent}%`}
                color={utilizationTextColor(selectedCellData.utilization_percent)}
              />
              <DetailStat
                label="Hours Logged"
                value={`${selectedCellData.hours_logged}h`}
                sub={`of ${selectedCellData.hours_capacity}h capacity`}
              />
              <DetailStat
                label="Hours Planned"
                value={`${selectedCellData.hours_estimated}h`}
                sub={`${selectedCellData.task_count} task${selectedCellData.task_count !== 1 ? "s" : ""}`}
              />
              <DetailStat
                label="Billable Hours"
                value={`${selectedCellData.billable_hours}h`}
                sub={
                  selectedCellData.hours_logged > 0
                    ? `${Math.round((selectedCellData.billable_hours / selectedCellData.hours_logged) * 100)}% billable`
                    : "No time logged"
                }
              />
            </div>

            {/* Capacity bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Capacity: {selectedCellData.hours_capacity}h/week</span>
                <span>
                  {Math.max(selectedCellData.hours_logged, selectedCellData.hours_estimated).toFixed(1)}h used
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    selectedCellData.utilization_percent > 120
                      ? "bg-red-500"
                      : selectedCellData.utilization_percent > 100
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(selectedCellData.utilization_percent, 150)}%`,
                    maxWidth: "100%",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Methodology note */}
        <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          <p>
            Utilization is calculated as the higher of logged hours (time entries) or planned hours (task estimates distributed across weeks) divided by weekly capacity.
            Full-time capacity defaults to 40h/week and part-time to 20h/week.
          </p>
        </div>
      </div>
    </FeatureGate>
    </ProtectedPage>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function DetailStat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${color || "text-gray-900 dark:text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
