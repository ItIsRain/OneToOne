"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Badge from "@/components/ui/badge/Badge";

interface Task {
  id: string;
  title: string;
  task_number: string;
  status: string;
  priority: string;
  start_date: string;
  due_date: string;
  progress_percentage: number;
  assignee: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  project: {
    id: string;
    name: string;
    project_code: string;
    color: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
  project_code: string;
  color: string;
  start_date: string;
  end_date: string;
  progress_percentage: number;
  status: string;
}

interface ProjectTimelineProps {
  projectId?: string;
}

const statusColors: Record<string, string> = {
  backlog: "bg-gray-400",
  todo: "bg-slate-400",
  in_progress: "bg-brand-500",
  in_review: "bg-warning-500",
  completed: "bg-success-500",
  blocked: "bg-error-500",
};

const priorityConfig: Record<string, { color: "primary" | "success" | "warning" | "error" | "light" }> = {
  low: { color: "light" },
  medium: { color: "primary" },
  high: { color: "warning" },
  urgent: { color: "error" },
  critical: { color: "error" },
};

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return today;
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch tasks and projects
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(selectedProjectId ? `/api/tasks?project_id=${selectedProjectId}` : "/api/tasks"),
        fetch("/api/projects"),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate timeline range
  const timelineConfig = useMemo(() => {
    const cellWidth = viewMode === "day" ? 40 : viewMode === "week" ? 120 : 180;
    const daysToShow = viewMode === "day" ? 30 : viewMode === "week" ? 12 * 7 : 6 * 30;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysToShow);

    // Generate date headers
    const headers: { label: string; subLabel?: string; date: Date; width: number }[] = [];
    const current = new Date(startDate);

    if (viewMode === "day") {
      while (current <= endDate) {
        headers.push({
          label: current.getDate().toString(),
          subLabel: current.toLocaleDateString("en-US", { weekday: "short" }),
          date: new Date(current),
          width: cellWidth,
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (viewMode === "week") {
      while (current <= endDate) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        headers.push({
          label: `${current.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
          date: new Date(current),
          width: cellWidth,
        });
        current.setDate(current.getDate() + 7);
      }
    } else {
      while (current <= endDate) {
        headers.push({
          label: current.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          date: new Date(current),
          width: cellWidth,
        });
        current.setMonth(current.getMonth() + 1);
      }
    }

    return { cellWidth, daysToShow, endDate, headers, totalWidth: headers.length * cellWidth };
  }, [startDate, viewMode]);

  // Calculate task position on timeline
  const getTaskPosition = (taskStart: string | null, taskEnd: string | null) => {
    if (!taskStart && !taskEnd) return null;

    const start = taskStart ? new Date(taskStart) : new Date(taskEnd!);
    const end = taskEnd ? new Date(taskEnd) : new Date(taskStart!);

    // Ensure end is after start
    if (end < start) return null;

    const timelineStart = startDate.getTime();
    const timelineEnd = timelineConfig.endDate.getTime();
    const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24);

    const startOffset = Math.max(0, (start.getTime() - timelineStart) / (1000 * 60 * 60 * 24));
    const endOffset = Math.min(totalDays, (end.getTime() - timelineStart) / (1000 * 60 * 60 * 24));

    if (endOffset < 0 || startOffset > totalDays) return null;

    const left = (startOffset / totalDays) * 100;
    const width = Math.max(2, ((endOffset - startOffset) / totalDays) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  // Navigate timeline
  const navigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      const today = new Date();
      today.setDate(today.getDate() - 7);
      setStartDate(today);
    } else {
      const days = viewMode === "day" ? 7 : viewMode === "week" ? 28 : 60;
      const newDate = new Date(startDate);
      newDate.setDate(newDate.getDate() + (direction === "next" ? days : -days));
      setStartDate(newDate);
    }
  };

  // Filter tasks with valid dates
  const tasksWithDates = tasks.filter((t) => t.start_date || t.due_date);

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasksWithDates.forEach((task) => {
      const projectKey = task.project?.id || "no-project";
      if (!grouped[projectKey]) grouped[projectKey] = [];
      grouped[projectKey].push(task);
    });
    return grouped;
  }, [tasksWithDates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => navigate("prev")}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-l-xl"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigate("today")}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Today
            </button>
            <button
              onClick={() => navigate("next")}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-r-xl"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === mode
                    ? "bg-brand-500 text-white"
                    : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectId || "all"}
            onChange={(e) => setSelectedProjectId(e.target.value === "all" ? undefined : e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Display */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} -{" "}
          {timelineConfig.endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        {/* Legend */}
        <div className="flex items-center gap-4 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
          {Object.entries(statusColors).slice(0, 5).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Task List (Left Panel) */}
          <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="h-14 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Tasks</span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({tasksWithDates.length})
              </span>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Object.entries(tasksByProject).map(([projectKey, projectTasks]) => {
                const project = projects.find((p) => p.id === projectKey);
                return (
                  <div key={projectKey}>
                    {/* Project Header */}
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 dark:bg-gray-800/30">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: project?.color || "#6366f1" }}
                      />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                        {project?.name || "No Project"}
                      </span>
                    </div>

                    {/* Tasks */}
                    {projectTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center h-12 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {task.task_number}
                          </p>
                        </div>
                        {task.assignee && (
                          <div className="flex-shrink-0 ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                            {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}

              {tasksWithDates.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tasks with dates</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Chart (Right Panel) */}
          <div className="flex-1 overflow-x-auto" ref={scrollContainerRef}>
            {/* Date Headers */}
            <div
              className="flex h-14 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50"
              style={{ width: `${timelineConfig.totalWidth}px` }}
            >
              {timelineConfig.headers.map((header, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center border-r border-gray-100 dark:border-gray-800 text-center"
                  style={{ width: header.width }}
                >
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {header.label}
                  </span>
                  {header.subLabel && (
                    <span className="text-xs text-gray-400">{header.subLabel}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Task Bars */}
            <div
              className="divide-y divide-gray-100 dark:divide-gray-800"
              style={{ width: `${timelineConfig.totalWidth}px` }}
            >
              {Object.entries(tasksByProject).map(([projectKey, projectTasks]) => (
                <div key={projectKey}>
                  {/* Project Header Row (Empty) */}
                  <div className="h-[34px] bg-gray-50 dark:bg-gray-800/30" />

                  {/* Task Rows */}
                  {projectTasks.map((task) => {
                    const position = getTaskPosition(task.start_date, task.due_date);
                    return (
                      <div key={task.id} className="relative h-12 border-gray-100 dark:border-gray-800">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex">
                          {timelineConfig.headers.map((_, idx) => (
                            <div
                              key={idx}
                              className="border-r border-gray-50 dark:border-gray-800/50"
                              style={{ width: timelineConfig.cellWidth }}
                            />
                          ))}
                        </div>

                        {/* Task Bar */}
                        {position && (
                          <div
                            className="absolute top-2 h-8 group cursor-pointer"
                            style={{ left: position.left, width: position.width }}
                          >
                            <div
                              className={`h-full rounded-lg ${statusColors[task.status] || "bg-gray-400"} shadow-sm transition-all group-hover:shadow-md relative overflow-hidden`}
                            >
                              {/* Progress Indicator */}
                              <div
                                className="absolute inset-y-0 left-0 bg-white/20 rounded-l-lg"
                                style={{ width: `${task.progress_percentage || 0}%` }}
                              />
                              {/* Task Title (only show if bar is wide enough) */}
                              <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white truncate">
                                {task.title}
                              </span>
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                              <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap">
                                <p className="font-semibold">{task.title}</p>
                                <p className="text-gray-400">
                                  {task.start_date && new Date(task.start_date).toLocaleDateString()} -{" "}
                                  {task.due_date && new Date(task.due_date).toLocaleDateString()}
                                </p>
                                <p className="text-gray-400">Progress: {task.progress_percentage || 0}%</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Today Marker */}
                        {(() => {
                          const todayPos = getTaskPosition(
                            new Date().toISOString(),
                            new Date().toISOString()
                          );
                          return todayPos ? (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-error-500"
                              style={{ left: todayPos.left }}
                            />
                          ) : null;
                        })()}
                      </div>
                    );
                  })}
                </div>
              ))}

              {tasksWithDates.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No timeline data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks without dates */}
      {tasks.filter((t) => !t.start_date && !t.due_date).length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
            Tasks without dates ({tasks.filter((t) => !t.start_date && !t.due_date).length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {tasks
              .filter((t) => !t.start_date && !t.due_date)
              .slice(0, 10)
              .map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: task.project?.color || "#6366f1" }}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{task.title}</span>
                  <Badge size="sm" color={priorityConfig[task.priority]?.color || "light"}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            {tasks.filter((t) => !t.start_date && !t.due_date).length > 10 && (
              <span className="text-xs text-gray-500 self-center">
                +{tasks.filter((t) => !t.start_date && !t.due_date).length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTimeline;
