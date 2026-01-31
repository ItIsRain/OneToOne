"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { LogTimeModal } from "./modals";
import { TimeEntryDetailsSidebar } from "./sidebars";

export interface TimeEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  description: string | null;
  is_billable: boolean;
  hourly_rate: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "invoiced";
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  invoice_id: string | null;
  break_minutes: number;
  work_type: "regular" | "overtime" | "holiday" | "weekend" | "on_call";
  location: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // Related data
  user?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
    job_title: string | null;
    hourly_rate: number;
  } | null;
  project?: {
    id: string;
    name: string;
    project_code: string | null;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
  approver?: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  submitted: { label: "Submitted", color: "primary" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  invoiced: { label: "Invoiced", color: "warning" },
};

const workTypeLabels: Record<string, string> = {
  regular: "Regular",
  overtime: "Overtime",
  holiday: "Holiday",
  weekend: "Weekend",
  on_call: "On-Call",
};

export const TimeEntriesTable = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = useState<TimeEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    billable: 0,
    pending: 0,
  });

  const fetchTimeEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team/time-entries");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch time entries");
      }

      setTimeEntries(data.timeEntries || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch time entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  const handleViewEntry = async (entry: TimeEntry) => {
    try {
      const res = await fetch(`/api/team/time-entries/${entry.id}`);
      const data = await res.json();
      if (res.ok) {
        setViewingEntry(data.timeEntry);
      } else {
        setViewingEntry(entry);
      }
    } catch {
      setViewingEntry(entry);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/team/time-entries/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete time entry");
      }

      setTimeEntries(timeEntries.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete time entry");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleEntrySaved = (entry: TimeEntry) => {
    if (editingEntry) {
      setTimeEntries(timeEntries.map((e) => (e.id === entry.id ? entry : e)));
    } else {
      setTimeEntries([entry, ...timeEntries]);
    }
    handleModalClose();
    fetchTimeEntries(); // Refresh to get updated stats
  };

  const handleStatusChange = async (entry: TimeEntry, newStatus: string) => {
    try {
      const res = await fetch(`/api/team/time-entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      const data = await res.json();
      setTimeEntries(timeEntries.map((e) => (e.id === entry.id ? data.timeEntry : e)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return "-";
    const [hours, minutes] = timeString.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getInitials = (user: TimeEntry["user"]): string => {
    if (!user) return "?";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getFullName = (user: TimeEntry["user"]): string => {
    if (!user) return "Unknown";
    return [user.first_name, user.last_name].filter(Boolean).join(" ");
  };

  // Filter entries
  const filteredEntries =
    statusFilter === "all"
      ? timeEntries
      : timeEntries.filter((e) => e.status === statusFilter);

  // Calculate weekly data for chart
  const getWeeklyData = () => {
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dateStr = date.toISOString().split("T")[0];
      const dayMinutes = timeEntries
        .filter((e) => e.date === dateStr)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      return { day, hours: Math.round((dayMinutes / 60) * 10) / 10 };
    });
  };

  const weeklyData = getWeeklyData();
  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 8);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchTimeEntries}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">
            {formatDuration(stats.today)}
          </h3>
          <p className="text-xs text-gray-400 mt-1">hours logged</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
          <h3 className="text-2xl font-bold text-brand-500 mt-1">
            {formatDuration(stats.thisWeek)}
          </h3>
          <p className="text-xs text-gray-400 mt-1">hours logged</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
          <h3 className="text-2xl font-bold text-success-500 mt-1">
            {formatDuration(stats.thisMonth)}
          </h3>
          <p className="text-xs text-gray-400 mt-1">hours logged</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</p>
          <h3 className={`text-2xl font-bold mt-1 ${stats.pending > 0 ? "text-warning-500" : "text-gray-400"}`}>
            {stats.pending}
          </h3>
          <p className="text-xs text-gray-400 mt-1">entries</p>
        </div>
      </div>

      {/* Weekly Overview Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Weekly Overview</h3>
        <div className="flex items-end gap-4 h-32">
          {weeklyData.map((stat) => (
            <div key={stat.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-lg relative" style={{ height: "100%" }}>
                <div
                  className="absolute bottom-0 w-full bg-brand-500 rounded-t-lg transition-all duration-300"
                  style={{ height: `${(stat.hours / maxHours) * 100}%`, minHeight: stat.hours > 0 ? "4px" : "0" }}
                />
              </div>
              <div className="text-center">
                <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">{stat.hours}h</span>
                <span className="block text-xs text-gray-500">{stat.day}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Time Entries
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
              {statusFilter !== "all" && ` (${statusFilter})`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: "All" },
                { key: "draft", label: "Draft" },
                { key: "submitted", label: "Pending" },
                { key: "approved", label: "Approved" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    statusFilter === filter.key
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddEntry}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Log Time
            </button>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No time entries yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start tracking your time by logging hours.
            </p>
            <button
              onClick={handleAddEntry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Log Time
            </button>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Team Member
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Date
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Project / Task
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Duration
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredEntries.map((entry) => {
                  const status = statusConfig[entry.status] || statusConfig.draft;

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {entry.user?.avatar_url ? (
                            <img
                              src={entry.user.avatar_url}
                              alt={getFullName(entry.user)}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                              {getInitials(entry.user)}
                            </div>
                          )}
                          <div>
                            <button
                              onClick={() => handleViewEntry(entry)}
                              className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                            >
                              {getFullName(entry.user)}
                            </button>
                            {entry.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                {entry.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div>
                          <span className="text-gray-800 text-theme-sm dark:text-white/90">
                            {formatDate(entry.date)}
                          </span>
                          {entry.start_time && (
                            <p className="text-xs text-gray-500">
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div>
                          {entry.project ? (
                            <>
                              <span className="text-gray-800 text-theme-sm dark:text-white/90">
                                {entry.project.name}
                              </span>
                              {entry.task && (
                                <p className="text-xs text-gray-500">{entry.task.title}</p>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-theme-sm italic">No project</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                            {formatDuration(entry.duration_minutes)}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.is_billable && (
                              <span className="text-xs text-success-500">
                                {formatCurrency((entry.duration_minutes / 60) * entry.hourly_rate)}
                              </span>
                            )}
                            {entry.work_type !== "regular" && (
                              <span className="text-xs text-warning-500">
                                {workTypeLabels[entry.work_type]}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="relative group">
                          <Badge size="sm" color={status.color}>
                            {status.label}
                          </Badge>
                          {/* Quick status change dropdown */}
                          {["draft", "submitted"].includes(entry.status) && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[130px]">
                                {entry.status === "draft" && (
                                  <button
                                    onClick={() => handleStatusChange(entry, "submitted")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-brand-500"
                                  >
                                    Submit for Approval
                                  </button>
                                )}
                                {entry.status === "submitted" && (
                                  <>
                                    <button
                                      onClick={() => handleStatusChange(entry, "approved")}
                                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-success-500"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(entry, "rejected")}
                                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-error-500"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewEntry(entry)}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium"
                          >
                            View
                          </button>
                          {["draft", "rejected"].includes(entry.status) && (
                            <>
                              <button
                                onClick={() => handleEditEntry(entry)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-theme-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                disabled={deletingId === entry.id}
                                className="text-error-500 hover:text-error-600 disabled:opacity-50 text-theme-sm font-medium"
                              >
                                {deletingId === entry.id ? "..." : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LogTimeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleEntrySaved}
        entry={editingEntry}
      />

      <TimeEntryDetailsSidebar
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        entry={viewingEntry}
        onEdit={(entry) => {
          setViewingEntry(null);
          handleEditEntry(entry);
        }}
        onDelete={handleDeleteEntry}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};
