"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { CreateProposalModal } from "@/components/agency/modals/CreateProposalModal";
import { ProposalDetailsSidebar } from "@/components/agency/sidebars/ProposalDetailsSidebar";

interface Proposal {
  id: string;
  tenant_id: string;
  client_id: string | null;
  lead_id: string | null;
  project_id: string | null;
  title: string;
  slug: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";
  sections: ProposalSection[];
  pricing_items: PricingItem[];
  subtotal: number;
  discount_percent: number;
  tax_percent: number;
  total: number;
  currency: string;
  valid_until: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  client_signature_data: string | null;
  client_signature_name: string | null;
  agency_signature_data: string | null;
  agency_signature_name: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  };
}

interface ProposalSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
}

interface PricingItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

const statusConfig: Record<
  string,
  { label: string; color: "light" | "info" | "warning" | "success" | "error" }
> = {
  draft: { label: "Draft", color: "light" },
  sent: { label: "Sent", color: "info" },
  viewed: { label: "Viewed", color: "warning" },
  accepted: { label: "Accepted", color: "success" },
  declined: { label: "Declined", color: "error" },
  expired: { label: "Expired", color: "light" },
};

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const ProposalsTable: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error("Error fetching proposals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/proposals/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProposals();
      }
    } catch (err) {
      console.error("Error duplicating proposal:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (viewingProposal?.id === id) {
          setViewingProposal(null);
        }
        setProposals((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Error deleting proposal:", err);
    }
  };

  const handleSend = async (id: string) => {
    try {
      const res = await fetch(`/api/proposals/${id}/send`, { method: "POST" });
      if (res.ok) {
        fetchProposals();
      }
    } catch (err) {
      console.error("Error sending proposal:", err);
    }
  };

  const handleCopyLink = async (slug: string) => {
    try {
      const url = `${window.location.origin}/proposal/${slug}`;
      await navigator.clipboard.writeText(url);
      alert("Proposal link copied to clipboard!");
    } catch {
      alert("Failed to copy link");
    }
  };

  const handleCreated = () => {
    setShowCreateModal(false);
    fetchProposals();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          Create Proposal
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">
            No proposals yet. Create your first proposal to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Title
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Client
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Valid Until
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => {
                  const status = statusConfig[proposal.status] || statusConfig.draft;
                  return (
                    <TableRow
                      key={proposal.id}
                      onClick={() => setViewingProposal(proposal)}
                      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02] ${viewingProposal?.id === proposal.id ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}
                    >
                      <TableCell className="px-5 py-4">
                        <a
                          href={`/dashboard/proposals/${proposal.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                        >
                          {proposal.title}
                        </a>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {proposal.client?.name || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge size="sm" color={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right text-sm font-medium text-gray-800 dark:text-white">
                        {formatCurrency(proposal.total, proposal.currency)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(proposal.valid_until)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(proposal.created_at)}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/dashboard/proposals/${proposal.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(proposal.slug); }}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Copy Link"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                          {proposal.status === "draft" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSend(proposal.id); }}
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Send"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(proposal.id); }}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Duplicate"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(proposal.id); }}
                            className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <CreateProposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />

      {viewingProposal && (
        <ProposalDetailsSidebar
          proposal={viewingProposal}
          onClose={() => setViewingProposal(null)}
          onRefresh={fetchProposals}
        />
      )}
    </div>
  );
};

export default ProposalsTable;
