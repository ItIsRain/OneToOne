"use client";

import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";

interface PortalApproval {
  id: string;
  tenant_id: string;
  project_id: string | null;
  task_id: string | null;
  portal_client_id: string | null;
  title: string;
  description: string | null;
  file_urls: string[];
  status: "pending" | "approved" | "rejected" | "revision_requested";
  client_comment: string | null;
  responded_at: string | null;
  created_at: string;
}

interface PortalApprovalCardProps {
  approval: PortalApproval;
  portalClientId: string;
  onResponded: () => void;
}

const statusBadgeColor = (
  status: PortalApproval["status"]
): "success" | "warning" | "error" | "info" => {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "error";
    case "revision_requested":
      return "info";
  }
};

const statusLabel = (status: PortalApproval["status"]) => {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending":
      return "Pending";
    case "rejected":
      return "Rejected";
    case "revision_requested":
      return "Revision Requested";
  }
};

export const PortalApprovalCard: React.FC<PortalApprovalCardProps> = ({
  approval,
  portalClientId,
  onResponded,
}) => {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (
    action: "approved" | "rejected" | "revision_requested"
  ) => {
    setSubmitting(true);
    setError(null);

    try {
      const sessionToken = localStorage.getItem("portal_session_token") || "";
      const res = await fetch("/api/portal/approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-portal-client-id": portalClientId,
          "x-portal-session-token": sessionToken,
        },
        body: JSON.stringify({
          approval_id: approval.id,
          status: action,
          client_comment: comment || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit response");
      }

      onResponded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {approval.title}
        </h3>
        <Badge color={statusBadgeColor(approval.status)} size="sm">
          {statusLabel(approval.status)}
        </Badge>
      </div>

      {/* Description */}
      {approval.description && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {approval.description}
        </p>
      )}

      {/* Files */}
      {approval.file_urls.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            Attached Files
          </p>
          <div className="flex flex-wrap gap-2">
            {approval.file_urls.map((url, idx) => {
              const fileName = url.split("/").pop() || `File ${idx + 1}`;
              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {fileName}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Previous Comment */}
      {approval.client_comment && approval.status !== "pending" && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Your comment
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {approval.client_comment}
          </p>
        </div>
      )}

      {/* Created date */}
      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Created {new Date(approval.created_at).toLocaleDateString()}
        {approval.responded_at &&
          ` | Responded ${new Date(approval.responded_at).toLocaleDateString()}`}
      </p>

      {/* Action Area (only for pending) */}
      {approval.status === "pending" && (
        <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-lime-500"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              onClick={() => handleAction("approved")}
              disabled={submitting}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:w-auto"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction("revision_requested")}
              disabled={submitting}
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 sm:w-auto"
            >
              Request Revision
            </button>
            <button
              onClick={() => handleAction("rejected")}
              disabled={submitting}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:w-auto"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
