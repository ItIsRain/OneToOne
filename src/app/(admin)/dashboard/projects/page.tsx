"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { AddProjectModal } from "@/components/agency/modals";

const projects = [
  { id: 1, name: "Website Redesign", client: "Acme Corp", status: "In Progress", progress: 65, dueDate: "Feb 15, 2025", team: 4 },
  { id: 2, name: "Mobile App Development", client: "TechStart", status: "In Progress", progress: 40, dueDate: "Mar 1, 2025", team: 6 },
  { id: 3, name: "Brand Identity", client: "Creative Co", status: "Review", progress: 90, dueDate: "Jan 30, 2025", team: 3 },
  { id: 4, name: "Marketing Campaign", client: "GrowthIO", status: "Planning", progress: 15, dueDate: "Apr 10, 2025", team: 5 },
  { id: 5, name: "E-commerce Platform", client: "Metro Events", status: "Completed", progress: 100, dueDate: "Jan 15, 2025", team: 7 },
];

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Projects</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage all your active projects</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            New Project
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.client}</p>
                </div>
                <Badge size="sm" color={
                  project.status === "Completed" ? "success" :
                  project.status === "In Progress" ? "primary" :
                  project.status === "Review" ? "warning" : "light"
                }>
                  {project.status}
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Due: {project.dueDate}</span>
                <span className="text-gray-500">{project.team} team members</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
