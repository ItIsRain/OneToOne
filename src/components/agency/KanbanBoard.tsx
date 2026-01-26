"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

// ===============================
// TYPES
// ===============================
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
    avatar_url: string | null;
  } | null;
  creator: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  project_code: string;
  color: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface KanbanColumn {
  key: string;
  label: string;
  color: string;
  bgColor: string;
}

interface KanbanBoardProps {
  projectId?: string;
}

// ===============================
// CONSTANTS
// ===============================
const defaultColumns: KanbanColumn[] = [
  { key: "backlog", label: "Backlog", color: "bg-gray-500", bgColor: "bg-gray-50 dark:bg-gray-800/30" },
  { key: "todo", label: "To Do", color: "bg-slate-500", bgColor: "bg-slate-50 dark:bg-slate-800/30" },
  { key: "in_progress", label: "In Progress", color: "bg-brand-500", bgColor: "bg-brand-50 dark:bg-brand-500/10" },
  { key: "in_review", label: "In Review", color: "bg-warning-500", bgColor: "bg-warning-50 dark:bg-warning-500/10" },
  { key: "completed", label: "Done", color: "bg-success-500", bgColor: "bg-success-50 dark:bg-success-500/10" },
];

const priorityConfig: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "light"; dotColor: string }> = {
  low: { label: "Low", color: "light", dotColor: "bg-gray-400" },
  medium: { label: "Medium", color: "primary", dotColor: "bg-brand-500" },
  high: { label: "High", color: "warning", dotColor: "bg-warning-500" },
  urgent: { label: "Urgent", color: "error", dotColor: "bg-error-500" },
  critical: { label: "Critical", color: "error", dotColor: "bg-error-600" },
};

const taskTypeIcons: Record<string, string> = {
  task: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  feature: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  bug: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  improvement: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  design: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  documentation: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  testing: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
};

// ===============================
// KANBAN BOARD COMPONENT
// ===============================
export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddColumn, setQuickAddColumn] = useState<string>("todo");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [columns] = useState<KanbanColumn[]>(defaultColumns);

  // Fetch data
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedProjectId && selectedProjectId !== "all"
        ? `/api/tasks?project_id=${selectedProjectId}`
        : "/api/tasks";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

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

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles");
      if (response.ok) {
        const data = await response.json();
        setProfiles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchProfiles();
  }, [fetchTasks]);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Get tasks by column
  const getColumnTasks = (columnKey: string) => {
    return filteredTasks.filter((t) => t.status === columnKey);
  };

  // Task status update
  const handleStatusChange = async (taskId: string, newStatus: string, newPosition?: number) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, position: newPosition ?? t.position } : t))
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, position: newPosition }),
      });
      if (!response.ok) {
        // Revert on failure
        fetchTasks();
      }
    } catch (err) {
      console.error("Error updating task status:", err);
      fetchTasks();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
    // Add a slight delay to allow the drag image to be set
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnKey) {
      handleStatusChange(draggedTask.id, columnKey);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setSelectedTask(null);
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // Format helpers
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
    if (diffDays <= 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = (dateString: string, status: string) => {
    if (!dateString || status === "completed") return false;
    return new Date(dateString) < new Date();
  };

  // Stats
  const stats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter((t) => t.status === "todo" || t.status === "backlog").length,
    inProgress: filteredTasks.filter((t) => t.status === "in_progress" || t.status === "in_review").length,
    completed: filteredTasks.filter((t) => t.status === "completed").length,
    overdue: filteredTasks.filter((t) => isOverdue(t.due_date, t.status)).length,
  };

  // Quick add task handler
  const openQuickAdd = (columnKey: string) => {
    setQuickAddColumn(columnKey);
    setIsQuickAddOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-error-50 p-6 text-center dark:bg-error-500/10">
        <p className="text-error-600 dark:text-error-400">{error}</p>
        <button onClick={fetchTasks} className="mt-4 text-sm text-brand-500 hover:text-brand-600">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} color="text-gray-800 dark:text-white" />
        <StatCard label="To Do" value={stats.todo} color="text-gray-600 dark:text-gray-300" />
        <StatCard label="In Progress" value={stats.inProgress} color="text-brand-500" />
        <StatCard label="Completed" value={stats.completed} color="text-success-500" />
        <StatCard label="Overdue" value={stats.overdue} color="text-error-500" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => openQuickAdd("todo")}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-brand-500/40"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-6 lg:px-6">
        {columns.map((column) => {
          const columnTasks = getColumnTasks(column.key);
          const isDragOver = dragOverColumn === column.key;

          return (
            <div
              key={column.key}
              className={`flex-shrink-0 w-80 rounded-2xl transition-all ${column.bgColor} ${
                isDragOver ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              {/* Column Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-gray-800 dark:text-white">{column.label}</h3>
                  <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/80 px-2 text-xs font-bold text-gray-600 dark:bg-gray-700/80 dark:text-gray-300">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openQuickAdd(column.key)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Column Tasks */}
              <div className="space-y-3 px-3 pb-4 min-h-[200px]">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedTask(task)}
                    isDragging={draggedTask?.id === task.id}
                    formatDate={formatDate}
                    isOverdue={isOverdue}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div
                    className={`flex h-32 items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                      isDragOver
                        ? "border-brand-400 bg-brand-50/50 dark:bg-brand-500/5"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {isDragOver ? "Drop here" : "No tasks"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Modal */}
      <QuickAddTaskModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {
          setIsQuickAddOpen(false);
          fetchTasks();
        }}
        defaultStatus={quickAddColumn}
        defaultProjectId={selectedProjectId !== "all" ? selectedProjectId : undefined}
        projects={projects}
        profiles={profiles}
      />

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsSidebar
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchTasks}
          onDelete={() => handleDelete(selectedTask.id)}
          profiles={profiles}
        />
      )}
    </div>
  );
};

// ===============================
// STAT CARD COMPONENT
// ===============================
const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

// ===============================
// TASK CARD COMPONENT
// ===============================
interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick: () => void;
  isDragging: boolean;
  formatDate: (date: string) => string;
  isOverdue: (date: string, status: string) => boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDragStart,
  onDragEnd,
  onClick,
  isDragging,
  formatDate,
  isOverdue,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 ${
        isDragging ? "opacity-50 scale-105 shadow-xl rotate-2" : ""
      }`}
    >
      {/* Task Type & Project */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.project && (
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: task.project.color || "#6366f1" }}
              />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {task.project.project_code}
              </span>
            </div>
          )}
        </div>
        {task.task_type && taskTypeIcons[task.task_type] && (
          <div className="rounded-lg bg-gray-100 p-1.5 dark:bg-gray-700">
            <svg className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={taskTypeIcons[task.task_type]} />
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white line-clamp-2 leading-snug">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {task.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Priority & Due Date */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${priorityConfig[task.priority]?.dotColor || "bg-gray-400"}`} />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {priorityConfig[task.priority]?.label || task.priority}
          </span>
        </div>
        {task.due_date && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              isOverdue(task.due_date, task.status)
                ? "bg-error-100 text-error-600 dark:bg-error-500/20 dark:text-error-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {task.progress_percentage > 0 && (
        <div className="mb-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${
                task.progress_percentage >= 100
                  ? "bg-success-500"
                  : task.progress_percentage >= 50
                  ? "bg-brand-500"
                  : "bg-warning-500"
              }`}
              style={{ width: `${Math.min(task.progress_percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            {task.assignee.avatar_url ? (
              <img
                src={task.assignee.avatar_url}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-medium text-white">
                {task.assignee.first_name?.[0]}
                {task.assignee.last_name?.[0]}
              </div>
            )}
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
  );
};

// ===============================
// QUICK ADD TASK MODAL
// ===============================
interface QuickAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultStatus: string;
  defaultProjectId?: string;
  projects: Project[];
  profiles: Profile[];
}

const QuickAddTaskModal: React.FC<QuickAddTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultStatus,
  defaultProjectId,
  projects,
  profiles,
}) => {
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: defaultProjectId || "",
    status: defaultStatus,
    priority: "medium",
    task_type: "task",
    assigned_to: "",
    due_date: "",
    estimated_hours: "",
    tags: "",
    category: "",
    acceptance_criteria: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        status: defaultStatus,
        project_id: defaultProjectId || prev.project_id,
      }));
    }
  }, [isOpen, defaultStatus, defaultProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          project_id: formData.project_id || null,
          assigned_to: formData.assigned_to || null,
          due_date: formData.due_date || null,
          estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
          tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          category: formData.category || null,
          acceptance_criteria: formData.acceptance_criteria || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      setFormData({
        title: "",
        description: "",
        project_id: defaultProjectId || "",
        status: defaultStatus,
        priority: "medium",
        task_type: "task",
        assigned_to: "",
        due_date: "",
        estimated_hours: "",
        tags: "",
        category: "",
        acceptance_criteria: "",
      });
      setShowMore(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "backlog", label: "Backlog" },
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review", label: "In Review" },
    { value: "completed", label: "Done" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
    { value: "critical", label: "Critical" },
  ];

  const taskTypeOptions = [
    { value: "task", label: "Task" },
    { value: "feature", label: "Feature" },
    { value: "bug", label: "Bug" },
    { value: "improvement", label: "Improvement" },
    { value: "documentation", label: "Documentation" },
    { value: "design", label: "Design" },
    { value: "testing", label: "Testing" },
  ];

  const categoryOptions = [
    { value: "frontend", label: "Frontend" },
    { value: "backend", label: "Backend" },
    { value: "design", label: "Design" },
    { value: "qa", label: "QA" },
    { value: "devops", label: "DevOps" },
    { value: "other", label: "Other" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create New Task</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a new task to the board</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <Label htmlFor="title">Task Title *</Label>
          <input
            autoFocus
            id="title"
            type="text"
            placeholder="What needs to be done?"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        {/* Project & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="project">Project</Label>
            <Select
              options={[{ value: "", label: "No project" }, ...projects.map((p) => ({ value: p.id, label: `${p.project_code} - ${p.name}` }))]}
              placeholder="Select project"
              value={formData.project_id}
              onChange={(value) => setFormData({ ...formData, project_id: value })}
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              options={taskTypeOptions}
              placeholder="Select type"
              value={formData.task_type}
              onChange={(value) => setFormData({ ...formData, task_type: value })}
            />
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              options={statusOptions}
              placeholder="Select status"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              options={priorityOptions}
              placeholder="Select priority"
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value })}
            />
          </div>
        </div>

        {/* Assignee & Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="assignee">Assignee</Label>
            <Select
              options={[{ value: "", label: "Unassigned" }, ...profiles.map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))]}
              placeholder="Assign to..."
              value={formData.assigned_to}
              onChange={(value) => setFormData({ ...formData, assigned_to: value })}
            />
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <TextArea
            placeholder="Add more details..."
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            rows={3}
          />
        </div>

        {/* More Options Toggle */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400"
        >
          {showMore ? "Less options" : "More options"}
          <svg
            className={`h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Extra Fields */}
        {showMore && (
          <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated">Estimated Hours</Label>
                <Input
                  id="estimated"
                  type="number"
                  step={0.5}
                  placeholder="e.g. 4"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  options={[{ value: "", label: "None" }, ...categoryOptions]}
                  placeholder="Select category"
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                type="text"
                placeholder="ui, api, urgent"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="acceptance">Acceptance Criteria</Label>
              <TextArea
                placeholder="What does done look like?"
                value={formData.acceptance_criteria}
                onChange={(value) => setFormData({ ...formData, acceptance_criteria: value })}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title.trim()}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ===============================
// TASK DETAILS SIDEBAR
// ===============================
interface TaskDetailsSidebarProps {
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  profiles: Profile[];
}

const TaskDetailsSidebar: React.FC<TaskDetailsSidebarProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  profiles,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    assigned_to: task.assignee?.id || "",
    due_date: task.due_date || "",
  });

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProgressUpdate = async (progress: number) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress_percentage: progress }),
      });
      onUpdate();
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          assigned_to: editData.assigned_to || null,
          due_date: editData.due_date || null,
        }),
      });
      setEditMode(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  const statusOptions = [
    { key: "backlog", label: "Backlog", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    { key: "todo", label: "To Do", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
    { key: "in_progress", label: "In Progress", color: "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" },
    { key: "in_review", label: "In Review", color: "bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400" },
    { key: "completed", label: "Done", color: "bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sidebar */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl dark:bg-gray-900 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            {task.project && (
              <div
                className="h-4 w-4 rounded-md"
                style={{ backgroundColor: task.project.color || "#6366f1" }}
              />
            )}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {task.task_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title & Project */}
          {editMode ? (
            <div>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{task.title}</h2>
              {task.project && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {task.project.project_code} - {task.project.name}
                </p>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Status</h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.key}
                  onClick={() => handleStatusUpdate(status.key)}
                  disabled={isUpdating}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    task.status === status.key
                      ? `${status.color} ring-2 ring-offset-2 dark:ring-offset-gray-900`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</h4>
              <span className="text-sm font-bold text-gray-800 dark:text-white">
                {task.progress_percentage || 0}%
              </span>
            </div>
            <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
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

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Priority</p>
              {editMode ? (
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${priorityConfig[task.priority]?.dotColor || "bg-gray-400"}`} />
                  <span className="font-medium text-gray-800 dark:text-white">
                    {priorityConfig[task.priority]?.label || task.priority}
                  </span>
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Due Date</p>
              {editMode ? (
                <input
                  type="date"
                  value={editData.due_date}
                  onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
              ) : (
                <p className={`font-medium ${isOverdue ? "text-error-500" : "text-gray-800 dark:text-white"}`}>
                  {formatDate(task.due_date)}
                </p>
              )}
            </div>

            {/* Assignee */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Assignee</p>
              {editMode ? (
                <select
                  value={editData.assigned_to}
                  onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Unassigned</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              ) : task.assignee ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-medium text-white">
                    {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                  </div>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {task.assignee.first_name} {task.assignee.last_name}
                  </span>
                </div>
              ) : (
                <p className="text-gray-400">Unassigned</p>
              )}
            </div>

            {/* Task Type */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Type</p>
              <p className="font-medium capitalize text-gray-800 dark:text-white">{task.task_type || "Task"}</p>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Time Tracking</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{task.estimated_hours || 0}h</p>
                <p className="text-xs text-gray-500">Estimated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{task.actual_hours || 0}h</p>
                <p className="text-xs text-gray-500">Logged</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  (task.actual_hours || 0) > (task.estimated_hours || 0) ? "text-error-500" : "text-success-500"
                }`}>
                  {((task.estimated_hours || 0) - (task.actual_hours || 0)).toFixed(1)}h
                </p>
                <p className="text-xs text-gray-500">Remaining</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Description</h4>
            {editMode ? (
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {task.description || "No description provided"}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Edit Mode Actions */}
          {editMode && (
            <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <button
                onClick={() => setEditMode(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
