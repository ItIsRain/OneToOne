"use client";
import React from "react";
import { ProjectsTable } from "@/components/agency/ProjectsTable";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function ProjectsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.PROJECTS_VIEW}>
      <FeatureGate feature="projects">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Projects</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage all your active projects</p>
          </div>

          <ProjectsTable />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
