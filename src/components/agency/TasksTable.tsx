"use client";
import React, { useState, useEffect } from "react";
import Badge from "@/components/ui/badge/Badge";
import { AddTaskModal, TaskDetailsModal } from "@/components/agency/modals";

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
  estimated_hours: number;
  actual_hours: number;
  progress_percentage: number;
  story_points: number;
  tags: string[];
  billable: boolean;
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
    avatar_url: string | null;
  } | null;
  creator: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  created_at: string;
}

const statusColumns = [
  { key: "backlog", label: "Backlog", color: "bg-gray-400" },
  { key: "todo", label: "To Do", color: "bg-gray-500" },
  { key: "in_progress", label: "In Progress", color: "bg-brand-500" },
  { key: "in_review", label: "In Review", color: "bg-warning-500" },
  { key: "completed", label: "Completed", color: "bg-success-500" },
];

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

const taskTypeConfig: Record<string, { label: string; icon: string }> = {
  task: { label: "Task", icon: "check" },
  feature: { label: "Feature", icon: "star" },
  bug: { label: "Bug", icon: "bug" },
  improvement: { label: "Improvement", icon: "trending-up" },
  documentation: { label: "Docs", icon: "file-text" },
  design: { label: "Design", icon: "palette" },
  testing: { label: "Testing", icon: "flask" },
};

export const TasksTable: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      }
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject = projectFilter === "all" || task.project?.id === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date() && dateString;
  };

  // Stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo" || t.status === "backlog").length,
    inProgress: tasks.filter((t) => t.status === "in_progress" || t.status === "in_review").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => isOverdue(t.due_date) && t.status !== "completed").length,
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">To Do</p>
          <p className="mt-1 text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.todo}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-brand-500">{stats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="mt-1 text-2xl font-bold text-success-500">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-error-500">{stats.overdue}</p>
        </div>
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {viewMode === "list" && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Priority</option>
                {Object.entries(priorityConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setViewMode("kanban")}
              className={`rounded-l-lg p-2.5 ${viewMode === "kanban" ? "bg-brand-500 text-white" : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
              title="Kanban View"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 4a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1h-3a1 1 0 01-1-1V4z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-r-lg p-2.5 ${viewMode === "list" ? "bg-brand-500 text-white" : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
              title="List View"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Add Task
        </button>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.key);
            return (
              <div
                key={column.key}
                className="flex-shrink-0 w-72 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                    <h3 className="font-medium text-gray-800 dark:text-white">{column.label}</h3>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* Project indicator */}
                      {task.project && (
                        <div className="mb-2 flex items-center gap-1.5">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: task.project.color || "#6366f1" }}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {task.project.project_code}
                          </span>
                        </div>
                      )}

                      <h4 className="mb-2 text-sm font-medium text-gray-800 dark:text-white line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge size="sm" color={priorityConfig[task.priority]?.color || "light"}>
                          {priorityConfig[task.priority]?.label || task.priority}
                        </Badge>

                        {task.due_date && (
                          <span className={`text-xs ${isOverdue(task.due_date) && task.status !== "completed" ? "text-error-500" : "text-gray-500 dark:text-gray-400"}`}>
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                              {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.assignee.first_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Unassigned</span>
                        )}

                        <span className="text-xs text-gray-400">{task.task_number}</span>
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center text-sm text-gray-400 dark:border-gray-700">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">No tasks found</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first task"}
              </p>
              {!searchQuery && statusFilter === "all" && priorityFilter === "all" && projectFilter === "all" && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Assignee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Due Date</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="text-left font-medium text-gray-800 hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
                        >
                          {task.title}
                        </button>
                        <p className="text-xs text-gray-400">{task.task_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        {task.project ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: task.project.color || "#6366f1" }} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{task.project.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="rounded border-0 bg-transparent text-sm font-medium focus:ring-0"
                          style={{ color: statusConfig[task.status]?.color === "success" ? "#22c55e" : statusConfig[task.status]?.color === "primary" ? "#6366f1" : "#6b7280" }}
                        >
                          {Object.entries(statusConfig).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <Badge size="sm" color={priorityConfig[task.priority]?.color || "light"}>
                          {priorityConfig[task.priority]?.label || task.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                              {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {task.assignee.first_name} {task.assignee.last_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${isOverdue(task.due_date) && task.status !== "completed" ? "font-medium text-error-500" : "text-gray-600 dark:text-gray-400"}`}>
                          {task.due_date ? formatDate(task.due_date) : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="mr-2 text-brand-500 hover:text-brand-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
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
        </>
      )}

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchTasks();
        }}
      />

      {selectedTask && (
        <TaskDetailsModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onUpdate={fetchTasks}
        />
      )}
    </div>
  );
};
