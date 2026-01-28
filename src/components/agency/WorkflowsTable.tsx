"use client";

import { useState, useEffect, useCallback } from "react";
import FeatureGate from "@/components/ui/FeatureGate";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { WorkflowTemplates } from "./WorkflowTemplates";

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: string;
  status: "active" | "draft" | "paused";
  is_template: boolean;
  steps?: unknown[];
  created_at?: string;
  updated_at?: string;
}

const TRIGGER_BADGE_MAP: Record<
  string,
  { label: string; color: "light" | "success" | "info" | "warning" | "primary" | "error" }
> = {
  manual: { label: "Manual", color: "light" },
  client_created: { label: "Client Created", color: "success" },
  project_created: { label: "Project Created", color: "info" },
  task_status_changed: { label: "Task Status Changed", color: "warning" },
  event_created: { label: "Event Created", color: "primary" },
  invoice_overdue: { label: "Invoice Overdue", color: "error" },
};

const TRIGGER_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "client_created", label: "Client Created" },
  { value: "project_created", label: "Project Created" },
  { value: "task_status_changed", label: "Task Status Changed" },
  { value: "event_created", label: "Event Created" },
  { value: "invoice_overdue", label: "Invoice Overdue" },
];

export const WorkflowsTable = () => {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "paused">("all");
  const [activeTab, setActiveTab] = useState<"workflows" | "templates">("workflows");
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTriggerType, setNewTriggerType] = useState("manual");
  const [saving, setSaving] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const url = `/api/workflows${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWorkflows(Array.isArray(data) ? data : data.workflows ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const filteredWorkflows = workflows
    .filter((w) => !w.is_template)
    .filter((w) =>
      search ? w.name.toLowerCase().includes(search.toLowerCase()) : true
    );

  const activeCount = workflows.filter((w) => !w.is_template && w.status === "active").length;
  const totalCount = workflows.filter((w) => !w.is_template).length;

  const handleToggleStatus = async (workflow: Workflow, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = workflow.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === workflow.id ? { ...w, status: newStatus } : w))
        );
      }
    } catch {
      // silently fail
    }
  };

  const handleRunNow = async (workflow: Workflow, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: "POST",
      });
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (workflow: Workflow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== workflow.id));
      }
    } catch {
      // silently fail
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
          trigger_type: newTriggerType,
          steps: [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const id = data.id ?? data.workflow?.id;
        setShowAddModal(false);
        setNewName("");
        setNewDescription("");
        setNewTriggerType("manual");
        if (id) {
          router.push(`/dashboard/automation/workflows/${id}`);
        } else {
          fetchWorkflows();
        }
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const getTriggerBadge = (triggerType: string) => {
    const mapped = TRIGGER_BADGE_MAP[triggerType];
    if (!mapped) {
      return <Badge variant="light" color="light" size="sm">{triggerType}</Badge>;
    }
    return (
      <Badge variant="light" color={mapped.color} size="sm">
        {mapped.label}
      </Badge>
    );
  };

  return (
    <FeatureGate feature="workflows">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Workflows</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{totalCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Runs This Month</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">--</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">--</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="mb-4 flex gap-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("workflows")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "workflows"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Workflows
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "templates"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Templates
            </button>
          </div>

          {activeTab === "workflows" && (
            <div>
              {/* Search, Filters, and Create Button */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Search */}
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search workflows..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 sm:w-64"
                    />
                  </div>

                  {/* Status Filter Buttons */}
                  <div className="flex gap-1">
                    {(["all", "active", "draft", "paused"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                          statusFilter === s
                            ? "bg-brand-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Workflow
                </button>
              </div>

              {/* Workflow Cards */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    No workflows found
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Create your first workflow to automate your agency tasks.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      onClick={() =>
                        router.push(`/dashboard/automation/workflows/${workflow.id}`)
                      }
                      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {workflow.name}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            workflow.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                              : workflow.status === "paused"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {workflow.status}
                        </span>
                      </div>

                      <div className="mb-3 flex items-center gap-2">
                        {getTriggerBadge(workflow.trigger_type)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {workflow.steps?.length ?? 0} step
                          {(workflow.steps?.length ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <button
                          onClick={(e) => handleToggleStatus(workflow, e)}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                            workflow.status === "active"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:hover:bg-yellow-500/25"
                              : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"
                          }`}
                        >
                          {workflow.status === "active" ? "Pause" : "Activate"}
                        </button>
                        <button
                          onClick={(e) => handleRunNow(workflow, e)}
                          className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                        >
                          Run Now
                        </button>
                        <button
                          onClick={(e) => handleDelete(workflow, e)}
                          className="ml-auto rounded-lg px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "templates" && <WorkflowTemplates />}
        </div>
      </div>

      {/* Add Workflow Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} className="max-w-lg p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Create Workflow
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. New Client Onboarding"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trigger Type
            </label>
            <select
              value={newTriggerType}
              onChange={(e) => setNewTriggerType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {TRIGGER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowAddModal(false)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateWorkflow}
            disabled={saving || !newName.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              "Create Workflow"
            )}
          </button>
        </div>
      </Modal>
    </FeatureGate>
  );
};
