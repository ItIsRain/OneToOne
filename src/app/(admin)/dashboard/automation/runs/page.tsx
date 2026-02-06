"use client";

import { useEffect, useState, useCallback } from "react";
import FeatureGate from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface StepExecution {
  step_name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  output: string | null;
  error: string | null;
}

interface WorkflowRun {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  started_at: string;
  completed_at: string | null;
  triggered_by: string;
  steps?: StepExecution[];
}

const STATUS_STYLES: Record<string, string> = {
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  waiting_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  waiting_approval: "Waiting Approval",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

function RunsContent() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workflows/runs");
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error("Failed to fetch runs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No workflow runs yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Workflow runs will appear here once workflows are triggered.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <Table className="w-full">
        <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
          <TableRow>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Workflow
            </TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Status
            </TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Started
            </TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Completed
            </TableCell>
            <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Triggered By
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <>
              <TableRow
                key={run.id}
                className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/30"
              >
                <TableCell
                  className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white"
                >
                  <button
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${expandedRun === run.id ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {run.workflow_name}
                  </button>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[run.status] || STATUS_STYLES.cancelled}`}
                  >
                    {STATUS_LABELS[run.status] || run.status}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(run.started_at).toLocaleString()}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {run.completed_at ? new Date(run.completed_at).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {run.triggered_by}
                </TableCell>
              </TableRow>

              {expandedRun === run.id && run.steps && run.steps.length > 0 && (
                <TableRow key={`${run.id}-steps`}>
                  <td className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30" colSpan={5}>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Step Execution Details
                      </p>
                      <div className="space-y-2">
                        {run.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {step.step_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[step.status] || STATUS_STYLES.cancelled}`}
                              >
                                {STATUS_LABELS[step.status] || step.status}
                              </span>
                              {step.started_at && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {new Date(step.started_at).toLocaleTimeString()}
                                </span>
                              )}
                              {step.error && (
                                <span className="max-w-xs truncate text-xs text-red-500" title={step.error}>
                                  {step.error}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function RunsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.AUTOMATION_VIEW}>
      <FeatureGate feature="workflows">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Runs</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor the execution history of your automated workflows.
            </p>
          </div>
          <RunsContent />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
