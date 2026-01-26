"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";

interface Project {
  id: string;
  name: string;
  project_code: string;
  description: string;
  status: string;
  priority: string;
  project_type: string;
  category: string;
  start_date: string;
  end_date: string;
  estimated_hours: number;
  actual_hours: number;
  budget_amount: number;
  budget_currency: string;
  billing_type: string;
  progress_percentage: number;
  tasks_total: number;
  tasks_completed: number;
  team_members: string[];
  visibility: string;
  color: string;
  tags: string[];
  client: {
    id: string;
    name: string;
    company: string;
  } | null;
  project_manager: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  team_lead: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  created_at: string;
}

interface ProjectDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onEdit: (project: Project) => void;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  planning: { label: "Planning", color: "light" },
  in_progress: { label: "In Progress", color: "primary" },
  on_hold: { label: "On Hold", color: "warning" },
  review: { label: "Review", color: "warning" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
  archived: { label: "Archived", color: "light" },
};

const priorityConfig: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "light" }> = {
  low: { label: "Low", color: "light" },
  medium: { label: "Medium", color: "primary" },
  high: { label: "High", color: "warning" },
  critical: { label: "Critical", color: "error" },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export const ProjectDetailsSidebar: React.FC<ProjectDetailsSidebarProps> = ({
  isOpen,
  onClose,
  project,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!project) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(project.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-success-500";
    if (progress >= 50) return "bg-brand-500";
    if (progress >= 25) return "bg-warning-500";
    return "bg-gray-400";
  };

  const remainingHours = (project.estimated_hours || 0) - (project.actual_hours || 0);
  const hoursOverrun = remainingHours < 0;

  const headerActions = (
    <>
      <a
        href={`/dashboard/projects/kanban?project=${project.id}`}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Kanban Board"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 4a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1h-3a1 1 0 01-1-1V4z" />
        </svg>
      </a>
      <button
        onClick={() => onEdit(project)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
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
      title={project.name}
      subtitle={project.project_code}
      headerActions={headerActions}
      width="xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={statusConfig[project.status]?.color || "light"}>
              {statusConfig[project.status]?.label || project.status}
            </Badge>
            <Badge size="sm" color={priorityConfig[project.priority]?.color || "light"}>
              {priorityConfig[project.priority]?.label || project.priority}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/dashboard/projects/kanban?project=${project.id}`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              View Board
            </a>
            <button
              onClick={() => onEdit(project)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Edit Project
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Color Indicator & Client */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div
            className="h-12 w-12 rounded-xl flex-shrink-0"
            style={{ backgroundColor: project.color || "#6366f1" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
            <p className="font-semibold text-gray-800 dark:text-white truncate">
              {project.client?.company || project.client?.name || "No client"}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Progress</h4>
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {project.progress_percentage || 0}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(project.progress_percentage)}`}
              style={{ width: `${project.progress_percentage || 0}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{project.tasks_completed || 0} of {project.tasks_total || 0} tasks completed</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={4}>
            <StatItem
              label="Budget"
              value={formatCurrency(project.budget_amount, project.budget_currency)}
            />
            <StatItem
              label="Est. Hours"
              value={`${project.estimated_hours || 0}h`}
            />
            <StatItem
              label="Logged"
              value={`${project.actual_hours || 0}h`}
            />
            <StatItem
              label="Remaining"
              value={`${Math.abs(remainingHours).toFixed(1)}h`}
              color={hoursOverrun ? "text-error-500" : "text-success-500"}
            />
          </StatsGrid>
        </div>

        {/* Description */}
        {project.description && (
          <Section title="Description">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {project.description}
            </p>
          </Section>
        )}

        {/* Project Details */}
        <Section title="Project Details">
          <InfoRow label="Type" value={project.project_type?.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} />
          <InfoRow label="Category" value={project.category} />
          <InfoRow label="Billing" value={project.billing_type?.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} />
          <InfoRow label="Visibility" value={project.visibility?.charAt(0).toUpperCase() + project.visibility?.slice(1)} />
        </Section>

        {/* Timeline */}
        <Section title="Timeline">
          <InfoRow label="Start Date" value={formatDate(project.start_date)} />
          <InfoRow label="End Date" value={formatDate(project.end_date)} />
        </Section>

        {/* Team */}
        <Section title="Team">
          {project.project_manager && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Project Manager</span>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                  {project.project_manager.first_name?.[0]}{project.project_manager.last_name?.[0]}
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {project.project_manager.first_name} {project.project_manager.last_name}
                </span>
              </div>
            </div>
          )}
          {project.team_lead && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-500 dark:text-gray-400">Team Lead</span>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success-100 text-xs font-medium text-success-600 dark:bg-success-500/20 dark:text-success-400">
                  {project.team_lead.first_name?.[0]}{project.team_lead.last_name?.[0]}
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {project.team_lead.first_name} {project.team_lead.last_name}
                </span>
              </div>
            </div>
          )}
        </Section>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
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

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`/dashboard/projects/kanban?project=${project.id}`}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 4a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1h-3a1 1 0 01-1-1V4z" />
              </svg>
              Kanban
            </a>
            <a
              href={`/dashboard/projects/timeline?project=${project.id}`}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Timeline
            </a>
          </div>
        </Section>

        {/* Metadata */}
        <div className="text-xs text-gray-400">
          <p>Created: {formatDate(project.created_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default ProjectDetailsSidebar;
