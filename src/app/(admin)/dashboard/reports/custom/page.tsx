"use client";
import React, { useState } from "react";
import { CreateCustomReportModal } from "@/components/agency/modals";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

const savedReports = [
  { id: 1, name: "Monthly Client Revenue", lastRun: "Jan 25, 2025", schedule: "Monthly" },
  { id: 2, name: "Weekly Task Summary", lastRun: "Jan 24, 2025", schedule: "Weekly" },
  { id: 3, name: "Quarterly Financial Overview", lastRun: "Jan 1, 2025", schedule: "Quarterly" },
];

export default function CustomReportsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ProtectedPage permission={PERMISSIONS.REPORTS_VIEW}>
      <FeatureGate feature="advanced_analytics">
        <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Custom Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Build and schedule custom reports</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Create Report
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Report Builder</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <option>Clients</option>
              <option>Projects</option>
              <option>Finance</option>
              <option>Team</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group By</label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <option>Day</option>
              <option>Week</option>
              <option>Month</option>
              <option>Quarter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <option>Table</option>
              <option>Chart</option>
              <option>Summary</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            Generate Preview
          </button>
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Save Report
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Saved Reports</h3>
        <div className="space-y-4">
          {savedReports.map((report) => (
            <div key={report.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90">{report.name}</h4>
                <p className="text-sm text-gray-500">Last run: {report.lastRun} • {report.schedule}</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">Run Now</button>
                <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>

        <CreateCustomReportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
