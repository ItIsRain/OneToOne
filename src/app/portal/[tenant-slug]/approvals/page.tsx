"use client";
import { useEffect, useState, useCallback } from "react";
import { PortalApprovalCard } from "@/components/portal/PortalApprovalCard";

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

export default function PortalApprovalsPage() {
  const [portalClientId, setPortalClientId] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<PortalApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = useCallback(async (clientId: string) => {
    try {
      const sessionToken = localStorage.getItem("portal_session_token") || "";
      const res = await fetch("/api/portal/approvals", {
        headers: {
          "x-portal-client-id": clientId,
          "x-portal-session-token": sessionToken,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
      }
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const clientId = localStorage.getItem("portal_client_id");
    setPortalClientId(clientId);
    if (clientId) {
      fetchApprovals(clientId);
    }
  }, [fetchApprovals]);

  if (!portalClientId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Approvals
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Review and approve pending items
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No approvals at this time.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {approvals.map((approval) => (
            <PortalApprovalCard
              key={approval.id}
              approval={approval}
              portalClientId={portalClientId}
              onResponded={() => fetchApprovals(portalClientId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
