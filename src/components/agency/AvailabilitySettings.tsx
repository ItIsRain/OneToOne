"use client";
import React, { useState, useEffect, useCallback } from "react";
import Label from "@/components/form/Label";

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface AvailabilitySlot {
  id?: string;
  member_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // "HH:mm"
  end_time: string; // "HH:mm"
  is_available: boolean;
}

interface DateOverride {
  id: string;
  member_id: string;
  date: string;
  is_blocked: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

const DAYS_OF_WEEK = [
  { index: 1, label: "Monday" },
  { index: 2, label: "Tuesday" },
  { index: 3, label: "Wednesday" },
  { index: 4, label: "Thursday" },
  { index: 5, label: "Friday" },
  { index: 6, label: "Saturday" },
  { index: 0, label: "Sunday" },
];

const DEFAULT_SCHEDULE: Omit<AvailabilitySlot, "member_id">[] = DAYS_OF_WEEK.map((day) => ({
  day_of_week: day.index,
  start_time: "09:00",
  end_time: "17:00",
  is_available: day.index >= 1 && day.index <= 5, // Mon-Fri enabled by default
}));

export const AvailabilitySettings = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [schedule, setSchedule] = useState<AvailabilitySlot[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Override form state
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideIsBlocked, setOverrideIsBlocked] = useState(true);
  const [overrideStartTime, setOverrideStartTime] = useState("");
  const [overrideEndTime, setOverrideEndTime] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [addingOverride, setAddingOverride] = useState(false);
  const [deletingOverrideId, setDeletingOverrideId] = useState<string | null>(null);

  // Fetch team members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/team/members");
        const data = await res.json();
        if (res.ok) {
          const rawMembers = data.members || [];
          const memberList: TeamMember[] = rawMembers
            .filter((m: { is_invite?: boolean }) => !m.is_invite)
            .map((m: { id: string; first_name: string; last_name?: string | null; email: string }) => ({
              id: m.id,
              name: [m.first_name, m.last_name].filter(Boolean).join(" "),
              email: m.email,
            }));
          setMembers(memberList);
          if (memberList.length > 0 && !selectedMemberId) {
            setSelectedMemberId(memberList[0].id);
          }
        }
      } catch {
        setError("Failed to fetch team members");
      }
    };
    fetchMembers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch availability when member changes
  const fetchAvailability = useCallback(async () => {
    if (!selectedMemberId) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/availability?member_id=${selectedMemberId}`);
      const data = await res.json();

      if (res.ok && data.availability && data.availability.length > 0) {
        setSchedule(data.availability);
      } else {
        // Use default schedule
        setSchedule(
          DEFAULT_SCHEDULE.map((slot) => ({
            ...slot,
            member_id: selectedMemberId,
          }))
        );
      }
    } catch {
      setError("Failed to fetch availability");
      setSchedule(
        DEFAULT_SCHEDULE.map((slot) => ({
          ...slot,
          member_id: selectedMemberId,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId]);

  const fetchOverrides = useCallback(async () => {
    if (!selectedMemberId) return;

    try {
      const res = await fetch(`/api/availability/overrides?member_id=${selectedMemberId}`);
      const data = await res.json();
      if (res.ok) {
        setOverrides(data.overrides || []);
      }
    } catch {
      // silently fail
    }
  }, [selectedMemberId]);

  useEffect(() => {
    fetchAvailability();
    fetchOverrides();
  }, [fetchAvailability, fetchOverrides]);

  const handleScheduleChange = (dayIndex: number, field: keyof AvailabilitySlot, value: string | boolean) => {
    setSchedule((prev) =>
      prev.map((slot) =>
        slot.day_of_week === dayIndex ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: selectedMemberId,
          entries: schedule,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save availability");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!overrideDate) {
      setError("Please select a date for the override");
      return;
    }

    setAddingOverride(true);
    setError("");

    try {
      const res = await fetch("/api/availability/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: selectedMemberId,
          date: overrideDate,
          is_blocked: overrideIsBlocked,
          start_time: overrideIsBlocked ? null : overrideStartTime || null,
          end_time: overrideIsBlocked ? null : overrideEndTime || null,
          reason: overrideReason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add override");
      }

      setOverrides([data.override, ...overrides]);
      setOverrideDate("");
      setOverrideIsBlocked(true);
      setOverrideStartTime("");
      setOverrideEndTime("");
      setOverrideReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add override");
    } finally {
      setAddingOverride(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm("Are you sure you want to delete this override?")) return;

    setDeletingOverrideId(id);
    try {
      const res = await fetch(`/api/availability/overrides/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete override");
      }

      setOverrides(overrides.filter((o) => o.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete override");
    } finally {
      setDeletingOverrideId(null);
    }
  };

  const getDaySlot = (dayIndex: number): AvailabilitySlot | undefined => {
    return schedule.find((s) => s.day_of_week === dayIndex);
  };

  return (
    <div className="space-y-6">
      {/* Member Selection */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Availability Settings
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure weekly availability and date overrides
            </p>
          </div>

          <div className="w-full sm:w-64">
            <Label htmlFor="member-select">Team Member</Label>
            <select
              id="member-select"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-error-500">{error}</p>
        )}
      </div>

      {/* Weekly Schedule */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-5 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
          Weekly Schedule
        </h4>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
              const slot = getDaySlot(day.index);
              const isAvailable = slot?.is_available ?? false;

              return (
                <div
                  key={day.index}
                  className={`flex flex-col gap-3 sm:flex-row sm:items-center rounded-lg border p-3 transition-colors ${
                    isAvailable
                      ? "border-gray-200 dark:border-gray-700"
                      : "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/30"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:w-40">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) =>
                          handleScheduleChange(day.index, "is_available", e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-700" />
                    </label>
                    <span
                      className={`text-sm font-medium ${
                        isAvailable
                          ? "text-gray-800 dark:text-white/90"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>

                  {isAvailable && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={slot?.start_time || "09:00"}
                        onChange={(e) =>
                          handleScheduleChange(day.index, "start_time", e.target.value)
                        }
                        className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input
                        type="time"
                        value={slot?.end_time || "17:00"}
                        onChange={(e) =>
                          handleScheduleChange(day.index, "end_time", e.target.value)
                        }
                        className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      />
                    </div>
                  )}

                  {!isAvailable && (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSaveSchedule}
            disabled={saving || loading}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Schedule"}
          </button>
          {saveSuccess && (
            <span className="text-sm text-success-500">Schedule saved successfully!</span>
          )}
        </div>
      </div>

      {/* Date Overrides */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-5 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
          Date Overrides
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Block specific dates or set custom hours that override the weekly schedule.
        </p>

        {/* Add Override Form */}
        <form onSubmit={handleAddOverride} className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="override-date">Date</Label>
              <input
                id="override-date"
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <Label htmlFor="override-blocked">Type</Label>
              <select
                id="override-blocked"
                value={overrideIsBlocked ? "blocked" : "custom"}
                onChange={(e) => setOverrideIsBlocked(e.target.value === "blocked")}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="blocked">Blocked (Unavailable)</option>
                <option value="custom">Custom Hours</option>
              </select>
            </div>

            {!overrideIsBlocked && (
              <>
                <div>
                  <Label htmlFor="override-start">Start Time</Label>
                  <input
                    id="override-start"
                    type="time"
                    value={overrideStartTime}
                    onChange={(e) => setOverrideStartTime(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  />
                </div>
                <div>
                  <Label htmlFor="override-end">End Time</Label>
                  <input
                    id="override-end"
                    type="time"
                    value={overrideEndTime}
                    onChange={(e) => setOverrideEndTime(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  />
                </div>
              </>
            )}

            <div className={overrideIsBlocked ? "sm:col-span-2" : "lg:col-span-4"}>
              <Label htmlFor="override-reason">Reason (optional)</Label>
              <input
                id="override-reason"
                type="text"
                placeholder="e.g., Holiday, Vacation, etc."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={addingOverride || !overrideDate}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
            >
              {addingOverride ? "Adding..." : "Add Override"}
            </button>
          </div>
        </form>

        {/* Existing Overrides */}
        {overrides.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
            No date overrides configured.
          </p>
        ) : (
          <div className="space-y-2">
            {overrides.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      override.is_blocked ? "bg-error-500" : "bg-warning-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {new Date(override.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {override.is_blocked
                        ? "Blocked"
                        : `Custom: ${override.start_time} - ${override.end_time}`}
                      {override.reason && ` - ${override.reason}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteOverride(override.id)}
                  disabled={deletingOverrideId === override.id}
                  className="text-error-500 hover:text-error-600 text-sm disabled:opacity-50"
                >
                  {deletingOverrideId === override.id ? "..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
