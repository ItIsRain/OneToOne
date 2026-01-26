"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import type { TimeEntry } from "../TimeEntriesTable";

interface Project {
  id: string;
  name: string;
  project_code: string | null;
}

interface Task {
  id: string;
  title: string;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  hourly_rate: number;
}

interface LogTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (entry: TimeEntry) => void;
  entry?: TimeEntry | null;
}

const workTypeOptions = [
  { value: "regular", label: "Regular" },
  { value: "overtime", label: "Overtime" },
  { value: "holiday", label: "Holiday" },
  { value: "weekend", label: "Weekend" },
  { value: "on_call", label: "On-Call" },
];

export function LogTimeModal({ isOpen, onClose, onSave, entry }: LogTimeModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    user_id: "",
    project_id: "",
    task_id: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    end_time: "",
    hours: "",
    minutes: "",
    description: "",
    is_billable: true,
    hourly_rate: 0,
    work_type: "regular",
    break_minutes: 0,
    location: "",
    notes: "",
    tags: [] as string[],
  });

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (res.ok) {
          setProjects(data.projects || []);
        }
      } catch {
        // Ignore errors, project selection is optional
      } finally {
        setLoadingProjects(false);
      }
    };
    if (isOpen) fetchProjects();
  }, [isOpen]);

  // Fetch team members
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch("/api/team/members");
        const data = await res.json();
        if (res.ok) {
          setTeamMembers(data.members || []);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoadingMembers(false);
      }
    };
    if (isOpen) fetchMembers();
  }, [isOpen]);

  // Fetch tasks when project changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!formData.project_id) {
        setTasks([]);
        return;
      }
      setLoadingTasks(true);
      try {
        const res = await fetch(`/api/projects/${formData.project_id}/tasks`);
        const data = await res.json();
        if (res.ok) {
          setTasks(data.tasks || []);
        }
      } catch {
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, [formData.project_id]);

  // Populate form when editing
  useEffect(() => {
    if (entry) {
      const hours = Math.floor(entry.duration_minutes / 60);
      const minutes = entry.duration_minutes % 60;
      setFormData({
        user_id: entry.user_id || "",
        project_id: entry.project_id || "",
        task_id: entry.task_id || "",
        date: entry.date || new Date().toISOString().split("T")[0],
        start_time: entry.start_time || "",
        end_time: entry.end_time || "",
        hours: hours.toString(),
        minutes: minutes.toString(),
        description: entry.description || "",
        is_billable: entry.is_billable ?? true,
        hourly_rate: entry.hourly_rate || 0,
        work_type: entry.work_type || "regular",
        break_minutes: entry.break_minutes || 0,
        location: entry.location || "",
        notes: entry.notes || "",
        tags: entry.tags || [],
      });
    } else {
      setFormData({
        user_id: "",
        project_id: "",
        task_id: "",
        date: new Date().toISOString().split("T")[0],
        start_time: "",
        end_time: "",
        hours: "",
        minutes: "",
        description: "",
        is_billable: true,
        hourly_rate: 0,
        work_type: "regular",
        break_minutes: 0,
        location: "",
        notes: "",
        tags: [],
      });
    }
    setError("");
  }, [entry, isOpen]);

  // Update hourly rate when member changes
  useEffect(() => {
    if (formData.user_id) {
      const member = teamMembers.find((m) => m.id === formData.user_id);
      if (member) {
        setFormData((prev) => ({
          ...prev,
          hourly_rate: member.hourly_rate || prev.hourly_rate,
        }));
      }
    }
  }, [formData.user_id, teamMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Calculate duration from hours/minutes or start/end time
      let durationMinutes = 0;
      if (formData.hours || formData.minutes) {
        durationMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
      }

      const payload = {
        user_id: formData.user_id || undefined,
        project_id: formData.project_id || null,
        task_id: formData.task_id || null,
        date: formData.date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        duration_minutes: durationMinutes > 0 ? durationMinutes : undefined,
        description: formData.description || null,
        is_billable: formData.is_billable,
        hourly_rate: formData.hourly_rate || undefined,
        work_type: formData.work_type,
        break_minutes: formData.break_minutes || 0,
        location: formData.location || null,
        notes: formData.notes || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
      };

      const url = entry
        ? `/api/team/time-entries/${entry.id}`
        : "/api/team/time-entries";

      const res = await fetch(url, {
        method: entry ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save time entry");
      }

      if (onSave) {
        onSave(data.timeEntry);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.project_code ? `[${p.project_code}] ${p.name}` : p.name,
  }));

  const taskOptions = tasks.map((t) => ({
    value: t.id,
    label: t.title,
  }));

  const memberOptions = teamMembers.map((m) => ({
    value: m.id,
    label: `${m.first_name} ${m.last_name || ""}`.trim(),
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          {entry ? "Edit Time Entry" : "Log Time"}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Team Member & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="member">Team Member</Label>
              <Select
                options={memberOptions}
                defaultValue={formData.user_id}
                onChange={(value) => setFormData({ ...formData, user_id: value })}
                placeholder={loadingMembers ? "Loading..." : "Select member (optional)"}
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty for yourself</p>
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Project & Task */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                options={projectOptions}
                defaultValue={formData.project_id}
                onChange={(value) => setFormData({ ...formData, project_id: value, task_id: "" })}
                placeholder={loadingProjects ? "Loading..." : "Select project (optional)"}
              />
            </div>

            <div>
              <Label htmlFor="task">Task</Label>
              <Select
                options={taskOptions}
                defaultValue={formData.task_id}
                onChange={(value) => setFormData({ ...formData, task_id: value })}
                placeholder={loadingTasks ? "Loading..." : "Select task (optional)"}
                disabled={!formData.project_id}
              />
            </div>
          </div>

          {/* Duration (Hours/Minutes) or Start/End Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</p>
              <p className="text-xs text-gray-400">Enter hours/minutes OR start/end time</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="24"
                  placeholder="0"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={formData.minutes}
                  onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="What did you work on?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Work Type & Billable */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="work_type">Work Type</Label>
              <Select
                options={workTypeOptions}
                defaultValue={formData.work_type}
                onChange={(value) => setFormData({ ...formData, work_type: value })}
              />
            </div>

            <div>
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step={0.01}
                placeholder="0.00"
                value={formData.hourly_rate || ""}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="break_minutes">Break (min)</Label>
              <Input
                id="break_minutes"
                type="number"
                min="0"
                placeholder="0"
                value={formData.break_minutes || ""}
                onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Office, Home, Client Site"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Billable Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={formData.is_billable}
              onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="billable" className="text-sm text-gray-600 dark:text-gray-400">
              Billable time
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : entry ? "Update Entry" : "Log Time"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
