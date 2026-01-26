"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";

interface Task {
  id: string;
  title: string;
  task_number: string;
  description?: string;
  status: string;
  priority: string;
  task_type?: string;
  due_date?: string;
  start_date?: string;
  started_at?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage?: number;
  story_points?: number;
  complexity?: string;
  category?: string;
  tags?: string[];
  labels?: string[];
  billable?: boolean;
  billing_rate?: number;
  acceptance_criteria?: string;
  internal_notes?: string;
  external_url?: string;
  git_branch?: string;
  position?: number;
  project?: {
    id: string;
    name: string;
    project_code: string;
    color: string;
  } | null;
  client?: {
    id: string;
    name: string;
    company: string;
  } | null;
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    avatar_url: string | null;
  } | null;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  parent_task?: {
    id: string;
    title: string;
    task_number: string;
    status: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

interface TaskDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate?: () => void;
  onDelete?: (id: string) => void;
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

const priorityConfig: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "light"; dotColor: string }> = {
  low: { label: "Low", color: "light", dotColor: "bg-gray-400" },
  medium: { label: "Medium", color: "primary", dotColor: "bg-brand-500" },
  high: { label: "High", color: "warning", dotColor: "bg-warning-500" },
  urgent: { label: "Urgent", color: "error", dotColor: "bg-error-500" },
  critical: { label: "Critical", color: "error", dotColor: "bg-error-600" },
};

const taskTypeConfig: Record<string, string> = {
  task: "Task",
  feature: "Feature",
  bug: "Bug",
  improvement: "Improvement",
  documentation: "Docs",
  design: "Design",
  testing: "Testing",
  research: "Research",
  meeting: "Meeting",
};

export const TaskDetailsSidebar: React.FC<TaskDetailsSidebarProps> = ({
  isOpen,
  onClose,
  task,
  onUpdate,
  onDelete,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!task) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (response.ok) {
        if (onDelete) onDelete(task.id);
        onClose();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const remainingHours = (task.estimated_hours || 0) - (task.actual_hours || 0);
  const hoursOverrun = remainingHours < 0;

  const headerActions = (
    <>
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      subtitle={`${task.task_number}${task.project ? ` • ${task.project.project_code}` : ""}`}
      headerActions={headerActions}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={statusConfig[task.status]?.color || "light"}>
              {statusConfig[task.status]?.label || task.status}
            </Badge>
            <Badge size="sm" color={priorityConfig[task.priority]?.color || "light"}>
              {priorityConfig[task.priority]?.label || task.priority}
            </Badge>
            {task.task_type && (
              <Badge size="sm" color="light">
                {taskTypeConfig[task.task_type] || task.task_type}
              </Badge>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Project & Client Info */}
        {task.project && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div
              className="h-10 w-10 rounded-lg flex-shrink-0"
              style={{ backgroundColor: task.project.color || "#6366f1" }}
            />
            <div className="min-w-0">
              <p className="font-medium text-gray-800 dark:text-white truncate">
                {task.project.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {task.project.project_code}
                {task.client && ` • ${task.client.company || task.client.name}`}
              </p>
            </div>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Progress</h4>
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {task.progress_percentage || 0}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (task.progress_percentage || 0) >= 100
                  ? "bg-success-500"
                  : (task.progress_percentage || 0) >= 50
                  ? "bg-brand-500"
                  : "bg-warning-500"
              }`}
              style={{ width: `${task.progress_percentage || 0}%` }}
            />
          </div>
          <div className="flex gap-1">
            {[0, 25, 50, 75, 100].map((val) => (
              <button
                key={val}
                onClick={() => handleProgressUpdate(val)}
                disabled={isUpdating}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                  (task.progress_percentage || 0) === val
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* Status Update */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Status</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusConfig).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => handleStatusUpdate(key)}
                disabled={isUpdating || task.status === key}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  task.status === key
                    ? "bg-brand-500 text-white ring-2 ring-brand-500/30"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                } disabled:opacity-50`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Tracking */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Time Tracking</h4>
          <StatsGrid columns={3}>
            <StatItem label="Estimated" value={`${task.estimated_hours || 0}h`} />
            <StatItem label="Logged" value={`${task.actual_hours || 0}h`} />
            <StatItem
              label="Remaining"
              value={`${Math.abs(remainingHours).toFixed(1)}h`}
              color={hoursOverrun ? "text-error-500" : "text-success-500"}
            />
          </StatsGrid>
        </div>

        {/* Assignee */}
        <Section title="Assignment">
          <InfoRow
            label="Assignee"
            value={
              task.assignee ? (
                <div className="flex items-center gap-2">
                  {task.assignee.avatar_url ? (
                    <img
                      src={task.assignee.avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                      {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                    </div>
                  )}
                  <span>{task.assignee.first_name} {task.assignee.last_name}</span>
                </div>
              ) : (
                "Unassigned"
              )
            }
          />
          <InfoRow
            label="Creator"
            value={task.creator ? `${task.creator.first_name} ${task.creator.last_name}` : null}
          />
        </Section>

        {/* Dates */}
        <Section title="Timeline">
          <InfoRow
            label="Due Date"
            value={
              <span className={isOverdue ? "text-error-500" : ""}>
                {formatDate(task.due_date)}
              </span>
            }
          />
          <InfoRow label="Start Date" value={formatDate(task.start_date)} />
          <InfoRow label="Started" value={formatDateTime(task.started_at)} />
          <InfoRow label="Completed" value={formatDateTime(task.completed_at)} />
        </Section>

        {/* Description */}
        {task.description && (
          <Section title="Description">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {task.description}
            </p>
          </Section>
        )}

        {/* Acceptance Criteria */}
        {task.acceptance_criteria && (
          <Section title="Acceptance Criteria">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {task.acceptance_criteria}
            </p>
          </Section>
        )}

        {/* Details */}
        <Section title="Details" collapsible defaultOpen={false}>
          <InfoRow label="Category" value={task.category} />
          <InfoRow label="Complexity" value={task.complexity} />
          <InfoRow label="Story Points" value={task.story_points} />
          <InfoRow label="Billable" value={task.billable ? "Yes" : "No"} />
          {task.billable && task.billing_rate && (
            <InfoRow label="Billing Rate" value={`$${task.billing_rate}/hr`} />
          )}
        </Section>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Links */}
        {(task.external_url || task.git_branch) && (
          <Section title="Links">
            {task.external_url && (
              <div className="mb-2">
                <a
                  href={task.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  External Link
                </a>
              </div>
            )}
            {task.git_branch && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 4.5C15 3.12 13.88 2 12.5 2S10 3.12 10 4.5c0 1.05.65 1.95 1.57 2.31v6.38c-.92.36-1.57 1.26-1.57 2.31 0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5c0-1.05-.65-1.95-1.57-2.31V6.81c.92-.36 1.57-1.26 1.57-2.31z"/>
                </svg>
                <code className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                  {task.git_branch}
                </code>
              </div>
            )}
          </Section>
        )}

        {/* Internal Notes */}
        {task.internal_notes && (
          <Section title="Internal Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {task.internal_notes}
            </p>
          </Section>
        )}

        {/* Parent Task */}
        {task.parent_task && (
          <Section title="Parent Task">
            <div className="flex items-center gap-2">
              <Badge size="sm" color={statusConfig[task.parent_task.status]?.color || "light"}>
                {statusConfig[task.parent_task.status]?.label}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {task.parent_task.task_number} - {task.parent_task.title}
              </span>
            </div>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDateTime(task.created_at)}</p>
          <p>Updated: {formatDateTime(task.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default TaskDetailsSidebar;
