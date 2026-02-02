"use client";
import React, { useState } from "react";
import { DetailsSidebar, Section, InfoRow } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  auto_track: boolean;
  track_entity: string | null;
  period_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  category: string | null;
  color: string;
  icon: string | null;
  milestones: Array<{ value: number; label: string; achieved_at?: string }>;
  updates: Array<{ date: string; value: number; note?: string }>;
  created_at: string;
  updated_at: string;
}

interface GoalDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
  onUpdateProgress?: (goal: Goal) => void;
}

const statusColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  draft: "light",
  active: "primary",
  completed: "success",
  failed: "error",
  cancelled: "warning",
};

export const GoalDetailsSidebar: React.FC<GoalDetailsSidebarProps> = ({
  isOpen,
  onClose,
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateValue, setUpdateValue] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  if (!goal) return null;

  const getProgress = () => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  const formatValue = (value: number) => {
    if (goal.target_type === "currency" || goal.unit === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(value);
    }
    if (goal.target_type === "percentage" || goal.unit === "%") {
      return `${value}%`;
    }
    if (goal.unit) {
      return `${value.toLocaleString()} ${goal.unit}`;
    }
    return value.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(goal.id);
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete goal");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete goal. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!updateValue) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          add_update: {
            value: parseFloat(updateValue),
            note: updateNote || null,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateProgress?.(data.goal);
        setUpdateValue("");
        setUpdateNote("");
        setShowUpdateForm(false);
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const progress = getProgress();

  const headerActions = (
    <>
      {onEdit && (
        <button
          onClick={() => onEdit(goal)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Edit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400"
          title="Delete"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      title={
        <span className="flex items-center gap-2">
          {goal.icon && <span className="text-xl">{goal.icon}</span>}
          {goal.title}
        </span>
      }
      subtitle={`${goal.period_type} goal`}
      headerActions={headerActions}
      width="lg"
    >
      <div className="space-y-6">
        {/* Status & Category */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={statusColors[goal.status] || "light"}>
            {goal.status}
          </Badge>
          {goal.category && (
            <Badge color="light">{goal.category}</Badge>
          )}
          {goal.auto_track && (
            <Badge color="primary">Auto-tracking</Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {progress}%
            </span>
          </div>
          <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                progress >= 100
                  ? "bg-success-500"
                  : progress >= 75
                  ? "bg-success-400"
                  : progress >= 50
                  ? "bg-warning-500"
                  : "bg-brand-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Current: {formatValue(goal.current_value)}</span>
            {goal.target_value && <span>Target: {formatValue(goal.target_value)}</span>}
          </div>
        </div>

        {/* Update Progress */}
        {!goal.auto_track && goal.status === "active" && (
          <div>
            {showUpdateForm ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <h4 className="font-medium text-gray-800 dark:text-white">Update Progress</h4>
                <input
                  type="number"
                  placeholder="New value"
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUpdateForm(false)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProgress}
                    disabled={isUpdating || !updateValue}
                    className="flex-1 px-3 py-2 text-sm bg-brand-500 text-white rounded-lg disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Update"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowUpdateForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand-500 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Update Progress
              </button>
            )}
          </div>
        )}

        {/* Description */}
        {goal.description && (
          <Section title="Description">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {goal.description}
            </p>
          </Section>
        )}

        {/* Details */}
        <Section title="Details">
          <InfoRow label="Target Type" value={goal.target_type} />
          <InfoRow label="Period" value={goal.period_type} />
          {goal.track_entity && (
            <InfoRow label="Tracking" value={goal.track_entity} />
          )}
          {goal.start_date && (
            <InfoRow label="Start Date" value={formatDate(goal.start_date)} />
          )}
          {goal.end_date && (
            <InfoRow label="End Date" value={formatDate(goal.end_date)} />
          )}
        </Section>

        {/* Milestones */}
        {goal.milestones && goal.milestones.length > 0 && (
          <Section title="Milestones">
            <div className="space-y-2">
              {goal.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    goal.current_value >= milestone.value
                      ? "bg-success-50 dark:bg-success-500/10"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                      goal.current_value >= milestone.value
                        ? "bg-success-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}
                  >
                    {goal.current_value >= milestone.value ? "✓" : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {milestone.label}
                    </p>
                    <p className="text-xs text-gray-500">{formatValue(milestone.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Update History */}
        {goal.updates && goal.updates.length > 0 && (
          <Section title="Update History">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {goal.updates.slice(-10).reverse().map((update, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {formatValue(update.value)}
                    </p>
                    {update.note && (
                      <p className="text-xs text-gray-500">{update.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(update.date)}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            <p>Created: {formatDate(goal.created_at)}</p>
            <p>Updated: {formatDate(goal.updated_at)}</p>
          </div>
        </div>
      </div>
    </DetailsSidebar>
  );
};
