"use client";
import React, { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/agency/KanbanBoard";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

interface Project {
  id: string;
  name: string;
  project_code: string;
  color: string;
}

export default function KanbanPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewMode, setViewMode] = useState<"board" | "timeline">("board");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  return (
    <ProtectedPage permission={PERMISSIONS.PROJECTS_VIEW}>
    <FeatureGate feature="kanban">
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Kanban Board
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Visualize and manage your tasks with drag and drop
          </p>
        </div>

        {/* View Toggle & Project Quick Select */}
        <div className="flex items-center gap-3">
          {/* Quick Project Pills */}
          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={() => setSelectedProject(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                !selectedProject
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              All Projects
            </button>
            {projects.slice(0, 4).map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedProject === project.id
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: project.color || "#6366f1" }}
                />
                {project.project_code}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                viewMode === "board"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 4a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h3a1 1 0 011 1v12a1 1 0 01-1 1h-3a1 1 0 01-1-1V4z" />
              </svg>
              Board
            </button>
            <a
              href="/dashboard/projects/timeline"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                viewMode === "timeline"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Timeline
            </a>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-brand-100/50 p-4 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-brand-500/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 dark:bg-brand-500/20">
          <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
            Drag and drop tasks between columns to update their status
          </p>
          <p className="text-xs text-brand-600 dark:text-brand-400">
            Click on any task to view details, update progress, or make changes
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard projectId={selectedProject || undefined} />
    </div>
    </FeatureGate>
    </ProtectedPage>
  );
}
