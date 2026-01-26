"use client";
import React, { useState, useEffect } from "react";
import Badge from "@/components/ui/badge/Badge";
import { AddProjectModal } from "@/components/agency/modals";
import { ProjectDetailsSidebar } from "@/components/agency/sidebars";

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

export const ProjectsTable: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
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

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-success-500";
    if (progress >= 50) return "bg-brand-500";
    if (progress >= 25) return "bg-warning-500";
    return "bg-gray-400";
  };

  // Stats
  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget_amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-error-50 p-4 text-error-600 dark:bg-error-500/10 dark:text-error-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-brand-500">{stats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="mt-1 text-2xl font-bold text-success-500">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">
            {formatCurrency(stats.totalBudget)}
          </p>
        </div>
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Priority</option>
            {Object.entries(priorityConfig).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-l-lg p-2.5 ${viewMode === "grid" ? "bg-brand-500 text-white" : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-r-lg p-2.5 ${viewMode === "list" ? "bg-brand-500 text-white" : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          New Project
        </button>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">No projects found</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first project"}
          </p>
          {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Create Project
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]"
            >
              {/* Color indicator */}
              <div
                className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                style={{ backgroundColor: project.color || "#6366f1" }}
              />

              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="text-left font-semibold text-gray-800 hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
                  >
                    {project.name}
                  </button>
                  <p className="mt-0.5 text-xs text-gray-400">{project.project_code}</p>
                  {project.client && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {project.client.company || project.client.name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge size="sm" color={statusConfig[project.status]?.color || "light"}>
                    {statusConfig[project.status]?.label || project.status}
                  </Badge>
                  <Badge size="sm" color={priorityConfig[project.priority]?.color || "light"}>
                    {priorityConfig[project.priority]?.label || project.priority}
                  </Badge>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {project.progress_percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(project.progress_percentage)}`}
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Info Grid */}
              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 dark:text-gray-500">Budget</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatCurrency(project.budget_amount, project.budget_currency)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatDate(project.end_date)}
                  </p>
                </div>
              </div>

              {/* Project Manager & Tasks */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  {project.project_manager ? (
                    <>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                        {project.project_manager.first_name?.[0]}
                        {project.project_manager.last_name?.[0]}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {project.project_manager.first_name} {project.project_manager.last_name}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No manager</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {project.tasks_completed}/{project.tasks_total} tasks
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4 opacity-0 transition-opacity group-hover:opacity-100 dark:border-gray-800">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="rounded-lg border border-error-300 bg-white px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 dark:border-error-500/50 dark:bg-gray-800 dark:text-error-400 dark:hover:bg-error-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="font-medium text-gray-800 hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
                    >
                      {project.name}
                    </button>
                    <p className="text-xs text-gray-400">{project.project_code}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {project.client?.company || project.client?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge size="sm" color={statusConfig[project.status]?.color || "light"}>
                      {statusConfig[project.status]?.label || project.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(project.progress_percentage)}`}
                          style={{ width: `${project.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {project.progress_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(project.budget_amount, project.budget_currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(project.end_date)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="mr-2 text-brand-500 hover:text-brand-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-error-500 hover:text-error-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchProjects();
        }}
      />

      <ProjectDetailsSidebar
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        onEdit={(project) => {
          setSelectedProject(null);
          // Open edit modal
          setIsAddModalOpen(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
};
