"use client";

import { useEffect, useState, useCallback } from "react";
import FeatureGate from "@/components/ui/FeatureGate";

interface Approval {
  id: string;
  workflow_id: string;
  workflow_name: string;
  run_id: string;
  step_name: string;
  step_description: string;
  requested_at: string;
  requested_by: string;
  status: "pending" | "approved" | "rejected";
}

function ApprovalsContent() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/workflows/approvals");
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleAction = async (approvalId: string, action: "approved" | "rejected") => {
    setActionLoading(approvalId);
    try {
      const res = await fetch("/api/workflows/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_id: approvalId,
          status: action,
          comment: comments[approvalId] || "",
        }),
      });
      if (res.ok) {
        await fetchApprovals();
        setComments((prev) => {
          const next = { ...prev };
          delete next[approvalId];
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to update approval:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  if (pendingApprovals.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No pending approvals</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          All workflow approvals have been processed. New approvals will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingApprovals.map((approval) => (
        <div
          key={approval.id}
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {approval.workflow_name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Step: {approval.step_name}
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {approval.step_description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                <span>Requested by {approval.requested_by}</span>
                <span>{new Date(approval.requested_at).toLocaleString()}</span>
                <span className="font-mono text-gray-300 dark:text-gray-600">
                  Run: {approval.run_id.slice(0, 8)}
                </span>
              </div>
            </div>
            <span className="ml-4 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              Pending
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <textarea
              placeholder="Add a comment (optional)"
              value={comments[approval.id] || ""}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, [approval.id]: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 dark:focus:border-lime-500"
              rows={2}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction(approval.id, "approved")}
                disabled={actionLoading === approval.id}
                className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-lime-600 disabled:opacity-50"
              >
                {actionLoading === approval.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Approve
              </button>
              <button
                onClick={() => handleAction(approval.id, "rejected")}
                disabled={actionLoading === approval.id}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {actionLoading === approval.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <FeatureGate feature="workflows">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Approvals</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and approve or reject pending workflow steps.
          </p>
        </div>
        <ApprovalsContent />
      </div>
    </FeatureGate>
  );
}
