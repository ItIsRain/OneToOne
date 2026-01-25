"use client";
import React from "react";
import { TasksTable } from "@/components/agency/TasksTable";

export default function ProjectTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Project Tasks</h1>
        <p className="text-gray-500 dark:text-gray-400">Track and complete tasks across all projects</p>
      </div>

      <TasksTable />
    </div>
  );
}
