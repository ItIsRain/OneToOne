"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { CreateApprovalModal } from "@/components/agency/modals/CreateApprovalModal";

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
  project?: { name: string } | null;
  portal_client?: { name: string } | null;
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

export const PortalApprovalsTable: React.FC = () => {
  const [approvals, setApprovals] = useState<PortalApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/approvals/manage");
      if (!res.ok) throw new Error("Failed to load approvals");
      const json = await res.json();
      setApprovals(json.approvals ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleCreated = () => {
    setModalOpen(false);
    fetchApprovals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-lime-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Approval Requests
        </h2>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-600"
        >
          Create Approval
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Title
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Project
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Client
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Created
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Responded
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No approval requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                approvals.map((approval) => (
                  <TableRow
                    key={approval.id}
                    className="border-b border-gray-50 dark:border-gray-800"
                  >
                    <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-white">
                      {approval.title}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {approval.project?.name || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {approval.portal_client?.name || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5">
                      <Badge
                        color={statusBadgeColor(approval.status)}
                        size="sm"
                      >
                        {statusLabel(approval.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(approval.created_at)}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(approval.responded_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateApprovalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};
