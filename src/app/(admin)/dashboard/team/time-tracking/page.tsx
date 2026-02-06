"use client";
import React from "react";
import { TimeEntriesTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function TimeTrackingPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.TEAM_VIEW}>
      <FeatureGate feature="time_tracking">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Time Tracking</h1>
              <p className="text-gray-500 dark:text-gray-400">Track team hours and productivity</p>
            </div>
          </div>

          <TimeEntriesTable />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
