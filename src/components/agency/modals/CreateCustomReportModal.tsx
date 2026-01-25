"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface CreateCustomReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dataSources = [
  { value: "clients", label: "Clients" },
  { value: "projects", label: "Projects" },
  { value: "events", label: "Events" },
  { value: "finance", label: "Finance" },
  { value: "team", label: "Team" },
  { value: "tasks", label: "Tasks" },
];

const dateRanges = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
  { value: "custom", label: "Custom range" },
];

const schedules = [
  { value: "none", label: "No schedule (manual)" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const formats = [
  { value: "table", label: "Table" },
  { value: "chart", label: "Chart" },
  { value: "summary", label: "Summary Cards" },
];

const metrics = [
  { id: "revenue", label: "Revenue", source: "finance" },
  { id: "expenses", label: "Expenses", source: "finance" },
  { id: "profit", label: "Profit", source: "finance" },
  { id: "clients", label: "Client Count", source: "clients" },
  { id: "events", label: "Event Count", source: "events" },
  { id: "tasks", label: "Task Count", source: "tasks" },
  { id: "completion", label: "Completion Rate", source: "tasks" },
  { id: "hours", label: "Hours Logged", source: "team" },
];

export function CreateCustomReportModal({ isOpen, onClose }: CreateCustomReportModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    dataSource: "finance",
    dateRange: "30d",
    schedule: "none",
    format: "table",
    groupBy: "day",
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["revenue"]);

  const toggleMetric = (id: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const availableMetrics = metrics.filter(
    (m) => m.source === formData.dataSource || formData.dataSource === "finance"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Report config:", { ...formData, metrics: selectedMetrics });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Create Custom Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="reportName">Report Name</Label>
            <Input
              id="reportName"
              placeholder="e.g., Monthly Revenue Summary"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataSource">Data Source</Label>
              <Select
                options={dataSources}
                defaultValue={formData.dataSource}
                onChange={(value) => {
                  setFormData({ ...formData, dataSource: value });
                  setSelectedMetrics([]);
                }}
              />
            </div>

            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select
                options={dateRanges}
                defaultValue={formData.dateRange}
                onChange={(value) => setFormData({ ...formData, dateRange: value })}
              />
            </div>
          </div>

          <div>
            <Label>Metrics to Include</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {availableMetrics.map((metric) => (
                <label
                  key={metric.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric.id)}
                    onChange={() => toggleMetric(metric.id)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {metric.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="format">Display Format</Label>
              <Select
                options={formats}
                defaultValue={formData.format}
                onChange={(value) => setFormData({ ...formData, format: value })}
              />
            </div>

            <div>
              <Label htmlFor="groupBy">Group By</Label>
              <Select
                options={[
                  { value: "day", label: "Day" },
                  { value: "week", label: "Week" },
                  { value: "month", label: "Month" },
                  { value: "quarter", label: "Quarter" },
                ]}
                defaultValue={formData.groupBy}
                onChange={(value) => setFormData({ ...formData, groupBy: value })}
              />
            </div>

            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Select
                options={schedules}
                defaultValue={formData.schedule}
                onChange={(value) => setFormData({ ...formData, schedule: value })}
              />
            </div>
          </div>

          {formData.schedule !== "none" && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/20 dark:bg-brand-500/10">
              <p className="text-sm text-brand-700 dark:text-brand-400">
                This report will be automatically generated {formData.schedule} and sent to your email.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg border border-brand-500 px-4 py-2.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            >
              Preview
            </button>
            <button
              type="submit"
              disabled={!formData.name || selectedMetrics.length === 0}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Report
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
