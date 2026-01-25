"use client";
import React, { useState } from "react";

export const ReportsGenerator = () => {
  const [reportType, setReportType] = useState("revenue");
  const [dateRange, setDateRange] = useState("this-month");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Reports
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate and export business reports
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Configuration */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="revenue">Revenue Report</option>
              <option value="clients">Client Summary</option>
              <option value="events">Events Report</option>
              <option value="tasks">Task Completion</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="this-quarter">This Quarter</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600">
              Generate Report
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
              Export PDF
            </button>
          </div>
        </div>

        {/* Quick Reports */}
        <div>
          <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Reports
          </h4>
          <div className="space-y-3">
            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  Monthly Revenue Summary
                </p>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Last generated: Jan 31, 2025
                </p>
              </div>
              <span className="text-brand-500 dark:text-brand-400 text-theme-sm font-medium">
                Download
              </span>
            </button>

            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  Client Activity Report
                </p>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Last generated: Jan 28, 2025
                </p>
              </div>
              <span className="text-brand-500 dark:text-brand-400 text-theme-sm font-medium">
                Download
              </span>
            </button>

            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  Q4 Events Summary
                </p>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Last generated: Jan 15, 2025
                </p>
              </div>
              <span className="text-brand-500 dark:text-brand-400 text-theme-sm font-medium">
                Download
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
