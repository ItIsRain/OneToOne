"use client";

import React, { useEffect, useState } from "react";
import Badge from "@/components/ui/badge/Badge";

interface ProjectTask {
  id: string;
  title: string;
  status: string;
  priority: string | null;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  tasks: ProjectTask[];
}

interface PortalProjectDetailProps {
  projectId: string;
  portalClientId: string;
}

const statusBadgeColor = (
  status: string
): "success" | "warning" | "error" | "info" | "light" => {
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
      return "success";
    case "in_progress":
    case "in progress":
      return "info";
    case "on_hold":
    case "on hold":
    case "pending":
      return "warning";
    case "cancelled":
    case "blocked":
      return "error";
    default:
      return "light";
  }
};

export const PortalProjectDetail: React.FC<PortalProjectDetailProps> = ({
  projectId,
  portalClientId,
}) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/portal/projects/${projectId}`, {
          headers: { "x-portal-client-id": portalClientId },
        });
        if (!res.ok) throw new Error("Failed to load project");
        const json = await res.json();
        setProject(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, portalClientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-lime-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!project) return null;

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {project.description}
              </p>
            )}
          </div>
          <Badge color={statusBadgeColor(project.status)}>
            {project.status.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Timeline & Progress */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Start Date
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(project.start_date)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Due Date
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(project.due_date)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Progress
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-lime-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {project.progress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Tasks
        </h2>
        {project.tasks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No tasks for this project.
          </p>
        ) : (
          <div className="space-y-2">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-800"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  {task.title}
                </span>
                <div className="flex items-center gap-2">
                  {task.priority && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {task.priority}
                    </span>
                  )}
                  <Badge
                    color={statusBadgeColor(task.status)}
                    size="sm"
                  >
                    {task.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
