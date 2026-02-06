"use client";
import React from "react";
import { TasksTable } from "@/components/agency/TasksTable";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function ProjectTasksPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.TASKS_VIEW}>
      <FeatureGate feature="projects">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Project Tasks</h1>
            <p className="text-gray-500 dark:text-gray-400">Track and complete tasks across all projects</p>
          </div>

          <TasksTable />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
