"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { TimeEntry } from "../TimeEntriesTable";

interface TimeEntryDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimeEntry | null;
  onEdit: (entry: TimeEntry) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (entry: TimeEntry, newStatus: string) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(timeString: string | null): string {
  if (!timeString) return "-";
  const [hours, minutes] = timeString.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  submitted: { label: "Submitted", color: "primary" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  invoiced: { label: "Invoiced", color: "warning" },
};

const workTypeConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  regular: { label: "Regular", color: "light" },
  overtime: { label: "Overtime", color: "warning" },
  holiday: { label: "Holiday", color: "success" },
  weekend: { label: "Weekend", color: "primary" },
  on_call: { label: "On-Call", color: "error" },
};

export const TimeEntryDetailsSidebar: React.FC<TimeEntryDetailsSidebarProps> = ({
  isOpen,
  onClose,
  entry,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!entry) return null;

  const status = statusConfig[entry.status] || statusConfig.draft;
  const workType = workTypeConfig[entry.work_type] || workTypeConfig.regular;
  const billableAmount = entry.is_billable ? (entry.duration_minutes / 60) * entry.hourly_rate : 0;
  const canEdit = ["draft", "rejected"].includes(entry.status);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this time entry?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(entry.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const getUserName = () => {
    if (!entry.user) return "Unknown";
    return `${entry.user.first_name} ${entry.user.last_name || ""}`.trim();
  };

  const getUserInitials = () => {
    if (!entry.user) return "?";
    const first = entry.user.first_name?.[0] || "";
    const last = entry.user.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const headerActions = (
    <>
      {canEdit && (
        <button
          onClick={() => onEdit(entry)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Edit"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onDelete && canEdit && (
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
      title={entry.description || "Time Entry"}
      subtitle={formatDate(entry.date)}
      headerActions={headerActions}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
            {entry.is_billable && (
              <Badge size="sm" color="success">Billable</Badge>
            )}
            {entry.work_type !== "regular" && (
              <Badge size="sm" color={workType.color}>
                {workType.label}
              </Badge>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Edit Entry
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Duration & Billing Summary */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={3}>
            <StatItem
              label="Duration"
              value={formatDuration(entry.duration_minutes)}
            />
            <StatItem
              label="Hourly Rate"
              value={formatCurrency(entry.hourly_rate)}
            />
            <StatItem
              label="Total Value"
              value={entry.is_billable ? formatCurrency(billableAmount) : "-"}
            />
          </StatsGrid>
        </div>

        {/* Team Member */}
        <Section title="Team Member">
          <div className="flex items-center gap-3">
            {entry.user?.avatar_url ? (
              <img
                src={entry.user.avatar_url}
                alt={getUserName()}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-semibold dark:bg-brand-500/20 dark:text-brand-400">
                {getUserInitials()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">{getUserName()}</p>
              {entry.user?.job_title && (
                <p className="text-sm text-gray-500">{entry.user.job_title}</p>
              )}
              {entry.user?.email && (
                <p className="text-xs text-gray-400">{entry.user.email}</p>
              )}
            </div>
          </div>
        </Section>

        {/* Time Details */}
        <Section title="Time Details">
          <InfoRow label="Date" value={formatDate(entry.date)} />
          {entry.start_time && (
            <InfoRow
              label="Time Range"
              value={`${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}`}
            />
          )}
          <InfoRow label="Duration" value={formatDuration(entry.duration_minutes)} />
          {entry.break_minutes > 0 && (
            <InfoRow label="Break" value={`${entry.break_minutes} min`} />
          )}
          <InfoRow label="Work Type" value={workType.label} />
        </Section>

        {/* Project & Task */}
        {(entry.project || entry.task) && (
          <Section title="Project / Task">
            {entry.project && (
              <InfoRow
                label="Project"
                value={
                  <span className="text-brand-500">
                    {entry.project.project_code ? `[${entry.project.project_code}] ` : ""}
                    {entry.project.name}
                  </span>
                }
              />
            )}
            {entry.task && (
              <InfoRow label="Task" value={entry.task.title} />
            )}
          </Section>
        )}

        {/* Description */}
        {entry.description && (
          <Section title="Description">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {entry.description}
            </p>
          </Section>
        )}

        {/* Billing */}
        <Section title="Billing">
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 text-sm ${entry.is_billable ? "text-success-500" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {entry.is_billable ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              Billable
            </div>
          </div>
          {entry.is_billable && (
            <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Rate</span>
                <span className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(entry.hourly_rate)}/hr</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600 dark:text-gray-400">Hours</span>
                <span className="font-medium text-gray-800 dark:text-white/90">{(entry.duration_minutes / 60).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-lg font-bold text-success-500">{formatCurrency(billableAmount)}</span>
              </div>
            </div>
          )}
        </Section>

        {/* Status Actions */}
        {onStatusChange && entry.status === "draft" && (
          <Section title="Quick Actions">
            <button
              onClick={() => onStatusChange(entry, "submitted")}
              className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
            >
              Submit for Approval
            </button>
          </Section>
        )}

        {onStatusChange && entry.status === "submitted" && (
          <Section title="Approval Actions">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onStatusChange(entry, "approved")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onStatusChange(entry, "rejected")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 transition-colors"
              >
                Reject
              </button>
            </div>
          </Section>
        )}

        {/* Rejection Reason */}
        {entry.status === "rejected" && entry.rejection_reason && (
          <Section title="Rejection Reason">
            <div className="rounded-lg bg-error-50 dark:bg-error-500/10 p-3">
              <p className="text-sm text-error-600 dark:text-error-400">
                {entry.rejection_reason}
              </p>
            </div>
          </Section>
        )}

        {/* Location */}
        {entry.location && (
          <Section title="Location">
            <InfoRow label="Location" value={entry.location} />
          </Section>
        )}

        {/* Notes */}
        {entry.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {entry.notes}
            </p>
          </Section>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag, index) => (
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

        {/* Approval Info */}
        {entry.approver && (
          <Section title="Approved By">
            <InfoRow
              label="Approver"
              value={`${entry.approver.first_name} ${entry.approver.last_name || ""}`.trim()}
            />
            <InfoRow label="Approved At" value={formatDateTime(entry.approved_at)} />
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDateTime(entry.created_at)}</p>
          <p>Updated: {formatDateTime(entry.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default TimeEntryDetailsSidebar;
