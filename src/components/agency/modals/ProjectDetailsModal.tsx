"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
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
  deadline_type: string;
  budget_amount: number;
  budget_currency: string;
  billing_type: string;
  hourly_rate: number;
  estimated_cost: number;
  actual_cost: number;
  profit_margin: number;
  invoice_status: string;
  payment_terms: string;
  progress_percentage: number;
  milestones_total: number;
  milestones_completed: number;
  tasks_total: number;
  tasks_completed: number;
  department: string;
  scope_summary: string;
  requirements: string;
  out_of_scope: string;
  visibility: string;
  slack_channel: string;
  communication_channel: string;
  repository_url: string;
  staging_url: string;
  production_url: string;
  figma_url: string;
  drive_folder_url: string;
  documentation_url: string;
  contract_signed: boolean;
  nda_required: boolean;
  nda_signed: boolean;
  tags: string[];
  industry: string;
  color: string;
  review_status: string;
  quality_score: number;
  client_satisfaction: number;
  lessons_learned: string;
  source: string;
  team_members: string[];
  client: {
    id: string;
    name: string;
    company: string;
    email?: string;
    phone?: string;
  } | null;
  primary_contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    job_title?: string;
  } | null;
  project_manager: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    avatar_url: string | null;
  } | null;
  team_lead: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    avatar_url: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdate?: () => void;
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

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "scope" | "team" | "links" | "financial">("overview");
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatBillingType = (type: string) => {
    const types: Record<string, string> = {
      fixed_price: "Fixed Price",
      hourly: "Hourly",
      retainer: "Retainer",
      milestone_based: "Milestone Based",
      time_and_materials: "Time & Materials",
    };
    return types[type] || type;
  };

  const formatPaymentTerms = (terms: string) => {
    const termLabels: Record<string, string> = {
      upon_receipt: "Upon Receipt",
      net_15: "Net 15",
      net_30: "Net 30",
      net_45: "Net 45",
      net_60: "Net 60",
      upon_completion: "Upon Completion",
      milestone_based: "Milestone Based",
    };
    return termLabels[terms] || terms;
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
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
      const response = await fetch(`/api/projects/${project.id}`, {
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

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-success-500";
    if (progress >= 50) return "bg-brand-500";
    if (progress >= 25) return "bg-warning-500";
    return "bg-gray-400";
  };

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
        activeTab === tab
          ? "border-b-2 border-brand-500 text-brand-500"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );

  const InfoRow = ({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={`flex flex-col sm:flex-row sm:items-center py-2 ${className}`}>
      <span className="text-sm text-gray-500 dark:text-gray-400 sm:w-40 sm:flex-shrink-0">{label}</span>
      <span className="mt-1 text-sm font-medium text-gray-800 dark:text-white sm:mt-0">{value || "-"}</span>
    </div>
  );

  const LinkButton = ({ url, label }: { url: string; label: string }) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {label}
      </a>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: project.color || "#6366f1" }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {project.name}
              </h3>
              <Badge size="sm" color={statusConfig[project.status]?.color || "light"}>
                {statusConfig[project.status]?.label || project.status}
              </Badge>
              <Badge size="sm" color={priorityConfig[project.priority]?.color || "light"}>
                {priorityConfig[project.priority]?.label || project.priority}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {project.project_code} {project.client && `• ${project.client.company || project.client.name}`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
          <span className="text-sm font-bold text-gray-800 dark:text-white">{project.progress_percentage}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-3 rounded-full transition-all ${getProgressColor(project.progress_percentage)}`}
            style={{ width: `${project.progress_percentage}%` }}
          />
        </div>
        <div className="mt-2 flex gap-2">
          {[0, 25, 50, 75, 100].map((val) => (
            <button
              key={val}
              onClick={() => handleProgressUpdate(val)}
              disabled={isUpdating}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                project.progress_percentage === val
                  ? "bg-brand-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
              }`}
            >
              {val}%
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        <TabButton tab="overview" label="Overview" />
        <TabButton tab="scope" label="Scope & Requirements" />
        <TabButton tab="team" label="Team" />
        <TabButton tab="links" label="Links & Resources" />
        <TabButton tab="financial" label="Financial" />
      </div>

      {/* Tab Content */}
      <div className="max-h-[50vh] overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">
                  {formatCurrency(project.budget_amount, project.budget_currency)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Tasks</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">
                  {project.tasks_completed}/{project.tasks_total}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Est. Hours</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">
                  {project.estimated_hours || 0}h
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Actual Hours</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">
                  {project.actual_hours || 0}h
                </p>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Project Details</h4>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  <InfoRow label="Project Type" value={project.project_type} />
                  <InfoRow label="Category" value={project.category} />
                  <InfoRow label="Industry" value={project.industry} />
                  <InfoRow label="Department" value={project.department} />
                  <InfoRow label="Visibility" value={project.visibility} />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Timeline</h4>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  <InfoRow label="Start Date" value={formatDate(project.start_date)} />
                  <InfoRow label="Due Date" value={formatDate(project.end_date)} />
                  <InfoRow label="Deadline Type" value={project.deadline_type} />
                  <InfoRow label="Created" value={formatDate(project.created_at)} />
                  <InfoRow label="Last Updated" value={formatDate(project.updated_at)} />
                </div>
              </div>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
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

            {/* Status Actions */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusConfig).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    onClick={() => handleStatusUpdate(key)}
                    disabled={isUpdating || project.status === key}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      project.status === key
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

        {activeTab === "scope" && (
          <div className="space-y-6">
            {project.scope_summary && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Scope Summary</h4>
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400 whitespace-pre-wrap">
                  {project.scope_summary}
                </p>
              </div>
            )}

            {project.requirements && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Requirements</h4>
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400 whitespace-pre-wrap">
                  {project.requirements}
                </p>
              </div>
            )}

            {project.out_of_scope && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Out of Scope</h4>
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400 whitespace-pre-wrap">
                  {project.out_of_scope}
                </p>
              </div>
            )}

            {/* Contract Status */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Contract & Legal</h4>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${project.contract_signed ? "bg-success-500" : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Contract {project.contract_signed ? "Signed" : "Not Signed"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${project.nda_required ? (project.nda_signed ? "bg-success-500" : "bg-warning-500") : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    NDA {project.nda_required ? (project.nda_signed ? "Signed" : "Required") : "Not Required"}
                  </span>
                </div>
              </div>
            </div>

            {!project.scope_summary && !project.requirements && !project.out_of_scope && (
              <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No scope information added yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-6">
            {/* Client Info */}
            {project.client && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Client</h4>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {project.client.company?.[0] || project.client.name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {project.client.company || project.client.name}
                    </p>
                    {project.client.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.client.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Project Manager */}
            {project.project_manager && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Project Manager</h4>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                    {project.project_manager.first_name?.[0]}
                    {project.project_manager.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {project.project_manager.first_name} {project.project_manager.last_name}
                    </p>
                    {project.project_manager.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.project_manager.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Team Lead */}
            {project.team_lead && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Team Lead</h4>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-lg font-medium text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                    {project.team_lead.first_name?.[0]}
                    {project.team_lead.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {project.team_lead.first_name} {project.team_lead.last_name}
                    </p>
                    {project.team_lead.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.team_lead.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Primary Contact */}
            {project.primary_contact && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Primary Contact</h4>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-medium text-green-600 dark:bg-green-500/20 dark:text-green-400">
                    {project.primary_contact.first_name?.[0]}
                    {project.primary_contact.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {project.primary_contact.first_name} {project.primary_contact.last_name}
                    </p>
                    {project.primary_contact.job_title && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.primary_contact.job_title}</p>
                    )}
                    {project.primary_contact.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.primary_contact.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!project.client && !project.project_manager && !project.team_lead && (
              <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No team members assigned yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <LinkButton url={project.repository_url} label="Repository" />
              <LinkButton url={project.figma_url} label="Figma Design" />
              <LinkButton url={project.staging_url} label="Staging Site" />
              <LinkButton url={project.production_url} label="Production Site" />
              <LinkButton url={project.drive_folder_url} label="Drive Folder" />
              <LinkButton url={project.documentation_url} label="Documentation" />
            </div>

            {project.slack_channel && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Communication</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Slack: <span className="font-medium">{project.slack_channel}</span>
                </p>
              </div>
            )}

            {!project.repository_url && !project.figma_url && !project.staging_url && !project.production_url && !project.drive_folder_url && (
              <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">No links added yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "financial" && (
          <div className="space-y-6">
            {/* Financial Overview */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">
                  {formatCurrency(project.budget_amount, project.budget_currency)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Cost</p>
                <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">
                  {formatCurrency(project.estimated_cost, project.budget_currency)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Actual Cost</p>
                <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">
                  {formatCurrency(project.actual_cost, project.budget_currency)}
                </p>
              </div>
            </div>

            {/* Financial Details */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Billing Details</h4>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <InfoRow label="Billing Type" value={formatBillingType(project.billing_type)} />
                <InfoRow label="Payment Terms" value={formatPaymentTerms(project.payment_terms)} />
                {project.hourly_rate > 0 && (
                  <InfoRow label="Hourly Rate" value={formatCurrency(project.hourly_rate, project.budget_currency)} />
                )}
                {project.profit_margin && (
                  <InfoRow label="Profit Margin" value={`${project.profit_margin}%`} />
                )}
                <InfoRow
                  label="Invoice Status"
                  value={
                    <Badge
                      size="sm"
                      color={
                        project.invoice_status === "fully_invoiced" ? "success" :
                        project.invoice_status === "partially_invoiced" ? "warning" : "light"
                      }
                    >
                      {project.invoice_status?.replace(/_/g, " ") || "Not Invoiced"}
                    </Badge>
                  }
                />
              </div>
            </div>

            {/* Hours Tracking */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Hours Tracking</h4>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{project.estimated_hours || 0}h</p>
                  <p className="text-xs text-gray-500">Estimated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{project.actual_hours || 0}h</p>
                  <p className="text-xs text-gray-500">Actual</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${(project.actual_hours || 0) > (project.estimated_hours || 0) ? "text-error-500" : "text-success-500"}`}>
                    {((project.estimated_hours || 0) - (project.actual_hours || 0)).toFixed(1)}h
                  </p>
                  <p className="text-xs text-gray-500">Remaining</p>
                </div>
              </div>
            </div>
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
