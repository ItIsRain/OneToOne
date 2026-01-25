"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";

interface Task {
  id: string;
  title: string;
  task_number: string;
  description: string;
  status: string;
  priority: string;
  task_type: string;
  due_date: string;
  start_date: string;
  started_at: string;
  completed_at: string;
  estimated_hours: number;
  actual_hours: number;
  progress_percentage: number;
  story_points: number;
  complexity: string;
  category: string;
  tags: string[];
  labels: string[];
  billable: boolean;
  billing_rate: number;
  acceptance_criteria: string;
  internal_notes: string;
  external_url: string;
  git_branch: string;
  position: number;
  project: {
    id: string;
    name: string;
    project_code: string;
    color: string;
  } | null;
  client: {
    id: string;
    name: string;
    company: string;
  } | null;
  assignee: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    avatar_url: string | null;
  } | null;
  creator: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  parent_task: {
    id: string;
    title: string;
    task_number: string;
    status: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate?: () => void;
}

const statusConfig: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "light" }> = {
  backlog: { label: "Backlog", color: "light" },
  todo: { label: "To Do", color: "light" },
  pending: { label: "Pending", color: "light" },
  in_progress: { label: "In Progress", color: "primary" },
  in_review: { label: "In Review", color: "warning" },
  blocked: { label: "Blocked", color: "error" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

const priorityConfig: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "light" }> = {
  low: { label: "Low", color: "light" },
  medium: { label: "Medium", color: "primary" },
  high: { label: "High", color: "warning" },
  urgent: { label: "Urgent", color: "error" },
  critical: { label: "Critical", color: "error" },
};

const taskTypeConfig: Record<string, { label: string; emoji: string }> = {
  task: { label: "Task", emoji: "" },
  feature: { label: "Feature", emoji: "" },
  bug: { label: "Bug", emoji: "" },
  improvement: { label: "Improvement", emoji: "" },
  documentation: { label: "Documentation", emoji: "" },
  research: { label: "Research", emoji: "" },
  design: { label: "Design", emoji: "" },
  testing: { label: "Testing", emoji: "" },
  deployment: { label: "Deployment", emoji: "" },
  meeting: { label: "Meeting", emoji: "" },
  other: { label: "Other", emoji: "" },
};

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
  onUpdate,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "time" | "notes">("details");

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProgressUpdate = async (progress: number) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress_percentage: progress }),
      });
      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-white text-right">{value || "-"}</span>
    </div>
  );

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        activeTab === tab
          ? "border-b-2 border-brand-500 text-brand-500"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-3">
          {task.project && (
            <div
              className="mt-1 h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.project.color || "#6366f1" }}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {task.task_number}
              </span>
              {task.task_type && (
                <Badge size="sm" color="light">
                  {taskTypeConfig[task.task_type]?.label || task.task_type}
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              {task.title}
            </h3>
            {task.project && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {task.project.project_code} - {task.project.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" color={statusConfig[task.status]?.color || "light"}>
            {statusConfig[task.status]?.label || task.status}
          </Badge>
          <Badge size="sm" color={priorityConfig[task.priority]?.color || "light"}>
            {priorityConfig[task.priority]?.label || task.priority}
          </Badge>
          {task.due_date && (
            <span className={`text-xs px-2 py-1 rounded ${
              isOverdue(task.due_date) && task.status !== "completed"
                ? "bg-error-100 text-error-600 dark:bg-error-500/20 dark:text-error-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}>
              Due: {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm font-bold text-gray-800 dark:text-white">{task.progress_percentage || 0}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 mb-2">
          <div
            className="h-2 rounded-full bg-brand-500 transition-all"
            style={{ width: `${task.progress_percentage || 0}%` }}
          />
        </div>
        <div className="flex gap-1">
          {[0, 25, 50, 75, 100].map((val) => (
            <button
              key={val}
              onClick={() => handleProgressUpdate(val)}
              disabled={isUpdating}
              className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                task.progress_percentage === val
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <TabButton tab="details" label="Details" />
        <TabButton tab="time" label="Time Tracking" />
        <TabButton tab="notes" label="Notes" />
      </div>

      {/* Tab Content */}
      <div className="max-h-[40vh] overflow-y-auto">
        {activeTab === "details" && (
          <div className="space-y-4">
            {/* Description */}
            {task.description && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  {task.description}
                </p>
              </div>
            )}

            {/* Acceptance Criteria */}
            {task.acceptance_criteria && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Acceptance Criteria</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  {task.acceptance_criteria}
                </p>
              </div>
            )}

            {/* Task Info */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <InfoRow label="Assignee" value={
                task.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                      {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                    </div>
                    <span>{task.assignee.first_name} {task.assignee.last_name}</span>
                  </div>
                ) : "Unassigned"
              } />
              <InfoRow label="Client" value={task.client?.company || task.client?.name} />
              <InfoRow label="Category" value={task.category} />
              <InfoRow label="Complexity" value={task.complexity} />
              <InfoRow label="Story Points" value={task.story_points} />
              <InfoRow label="Start Date" value={formatDate(task.start_date)} />
              <InfoRow label="Due Date" value={formatDate(task.due_date)} />
              <InfoRow label="Billable" value={task.billable ? "Yes" : "No"} />
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            {(task.external_url || task.git_branch) && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Links</h4>
                {task.external_url && (
                  <a
                    href={task.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    External Link
                  </a>
                )}
                {task.git_branch && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15 4.5C15 3.12 13.88 2 12.5 2S10 3.12 10 4.5c0 1.05.65 1.95 1.57 2.31v6.38c-.92.36-1.57 1.26-1.57 2.31 0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5c0-1.05-.65-1.95-1.57-2.31V6.81c.92-.36 1.57-1.26 1.57-2.31zm-2.5 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                    </svg>
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">{task.git_branch}</code>
                  </div>
                )}
              </div>
            )}

            {/* Status Actions */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => handleStatusUpdate(key)}
                    disabled={isUpdating || task.status === key}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      task.status === key
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "time" && (
          <div className="space-y-4">
            {/* Time Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{task.estimated_hours || 0}h</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Estimated</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{task.actual_hours || 0}h</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Logged</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
                <p className={`text-2xl font-bold ${
                  (task.actual_hours || 0) > (task.estimated_hours || 0)
                    ? "text-error-500"
                    : "text-success-500"
                }`}>
                  {((task.estimated_hours || 0) - (task.actual_hours || 0)).toFixed(1)}h
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Timeline</h4>
              <InfoRow label="Created" value={formatDateTime(task.created_at)} />
              <InfoRow label="Started" value={formatDateTime(task.started_at)} />
              <InfoRow label="Completed" value={formatDateTime(task.completed_at)} />
              <InfoRow label="Last Updated" value={formatDateTime(task.updated_at)} />
            </div>

            {task.billable && (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Billable Task</span>
                  {task.billing_rate && (
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      Rate: ${task.billing_rate}/hr
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-4">
            {task.internal_notes ? (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Internal Notes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  {task.internal_notes}
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No internal notes</p>
              </div>
            )}

            {/* Parent Task */}
            {task.parent_task && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Parent Task</h4>
                <div className="flex items-center gap-2">
                  <Badge size="sm" color={statusConfig[task.parent_task.status]?.color || "light"}>
                    {statusConfig[task.parent_task.status]?.label}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {task.parent_task.task_number} - {task.parent_task.title}
                  </span>
                </div>
              </div>
            )}

            {/* Creator */}
            {task.creator && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Created By</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {task.creator.first_name} {task.creator.last_name}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
