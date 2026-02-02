"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface PortalProject {
  id: string;
  name: string;
  status: string;
  progress: number;
  start_date: string | null;
  due_date: string | null;
}

interface PortalProjectsListProps {
  portalClientId: string;
}

const statusBadgeColor = (
  status: string
): "success" | "warning" | "error" | "info" | "light" => {
  switch (status.toLowerCase()) {
    case "completed":
      return "success";
    case "in_progress":
    case "in progress":
      return "info";
    case "on_hold":
    case "on hold":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "light";
  }
};

export const PortalProjectsList: React.FC<PortalProjectsListProps> = ({
  portalClientId,
}) => {
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const sessionToken = localStorage.getItem("portal_session_token") || "";
        const res = await fetch("/api/portal/projects", {
          headers: {
            "x-portal-client-id": portalClientId,
            "x-portal-session-token": sessionToken,
          },
        });
        if (!res.ok) throw new Error("Failed to load projects");
        const json = await res.json();
        setProjects(json.projects || json || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [portalClientId]);

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

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Projects
      </h1>

      {projects.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
          No projects found.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 sm:hidden">
            {projects.map((project) => (
              <a
                key={project.id}
                href={`projects/${project.id}`}
                className="block rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <Badge
                    color={statusBadgeColor(project.status)}
                    size="sm"
                  >
                    {project.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-lime-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {project.progress}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Start:</span> {formatDate(project.start_date)}
                  </div>
                  <div>
                    <span className="font-medium">Due:</span> {formatDate(project.due_date)}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900 sm:block">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Progress
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Start Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Due Date
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <React.Fragment key={project.id}>
                      <TableRow
                        className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                      >
                        <TableCell
                          className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-white"
                        >
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === project.id ? null : project.id
                              )
                            }
                            className="text-left hover:underline"
                          >
                            {project.name}
                          </button>
                        </TableCell>
                        <TableCell className="px-5 py-3.5">
                          <Badge
                            color={statusBadgeColor(project.status)}
                            size="sm"
                          >
                            {project.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-full rounded-full bg-lime-500"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {project.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(project.start_date)}
                        </TableCell>
                        <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(project.due_date)}
                        </TableCell>
                      </TableRow>
                      {expandedId === project.id && (
                        <TableRow>
                          <TableCell className="bg-gray-50 px-5 py-4 dark:bg-gray-800/30">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <a
                                href={`projects/${project.id}`}
                                className="font-medium text-lime-600 hover:underline dark:text-lime-400"
                              >
                                View full project details
                              </a>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
