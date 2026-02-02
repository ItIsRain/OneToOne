"use client";
import React, { useState } from "react";
import {
  DetailsSidebar,
  InfoRow,
  Section,
  StatsGrid,
  StatItem,
} from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";

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

interface ProposalDetailsSidebarProps {
  proposal: Proposal;
  onClose: () => void;
  onRefresh: () => void;
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

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export const ProposalDetailsSidebar: React.FC<ProposalDetailsSidebarProps> = ({
  proposal,
  onClose,
  onRefresh,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isPipelineLoading, setIsPipelineLoading] = useState(false);

  const status = statusConfig[proposal.status] || statusConfig.draft;

  const handleSend = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/send`, {
        method: "POST",
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error sending proposal:", err);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/dashboard/proposals/${data.proposal.id}`;
      }
    } catch (err) {
      console.error("Error duplicating proposal:", err);
    }
  };

  const handleGenerateContract = async () => {
    setIsPipelineLoading(true);
    try {
      const res = await fetch("/api/pipeline/proposal-to-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposal.id }),
      });
      const data = await res.json();
      if (res.ok && data.contract) {
        window.location.href = `/dashboard/contracts/${data.contract.id}`;
      } else {
        alert(data.error || "Failed to generate contract");
      }
    } catch (err) {
      console.error("Error generating contract:", err);
    } finally {
      setIsPipelineLoading(false);
    }
  };

  const handleConvertToProject = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = `/dashboard/projects/${data.project.id}`;
      } else if (res.status === 409) {
        alert(data.error || "This proposal has already been converted");
      } else {
        alert(data.error || "Failed to convert proposal");
      }
    } catch (err) {
      console.error("Error converting to project:", err);
      alert("Failed to convert proposal. Please try again.");
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/proposal/${proposal.slug}`;
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert("Failed to copy link");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.href = "/dashboard/proposals";
      }
    } catch (err) {
      console.error("Error deleting proposal:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={handleCopyLink}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={copySuccess ? "Copied!" : "Copy Link"}
      >
        {copySuccess ? (
          <svg className="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </button>
      <button
        onClick={handleDuplicate}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Duplicate"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
        title="Delete"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </>
  );

  return (
    <DetailsSidebar
      isOpen={true}
      onClose={onClose}
      title={proposal.title}
      subtitle={proposal.client?.name || "No client assigned"}
      headerActions={headerActions}
      width="xl"
      footer={
        <div className="flex items-center justify-between">
          <Badge size="sm" color={status.color}>
            {status.label}
          </Badge>
          <div className="flex items-center gap-2">
            {proposal.status === "draft" && (
              <button
                onClick={handleSend}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Send Proposal
              </button>
            )}
            {proposal.status === "accepted" && !proposal.project_id && (
              <>
                <button
                  onClick={handleGenerateContract}
                  disabled={isPipelineLoading}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isPipelineLoading ? "Generating..." : "Generate Contract"}
                </button>
                <button
                  onClick={handleConvertToProject}
                  className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors"
                >
                  Convert to Project
                </button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Financial Summary */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={2}>
            <StatItem
              label="Total"
              value={formatCurrency(proposal.total, proposal.currency)}
            />
            <StatItem
              label="Sections"
              value={String(proposal.sections?.length || 0)}
            />
          </StatsGrid>
        </div>

        {/* Status Info */}
        <Section title="Status">
          <InfoRow
            label="Current Status"
            value={
              <Badge size="sm" color={status.color}>
                {status.label}
              </Badge>
            }
          />
        </Section>

        {/* Client */}
        <Section title="Client">
          <InfoRow
            label="Name"
            value={proposal.client?.name || "Not assigned"}
          />
          {proposal.client?.company && (
            <InfoRow label="Company" value={proposal.client.company} />
          )}
          {proposal.client?.email && (
            <InfoRow
              label="Email"
              value={
                <a
                  href={`mailto:${proposal.client.email}`}
                  className="text-brand-500 hover:text-brand-600"
                >
                  {proposal.client.email}
                </a>
              }
            />
          )}
        </Section>

        {/* Dates */}
        <Section title="Timeline">
          <InfoRow label="Created" value={formatDate(proposal.created_at)} />
          <InfoRow label="Valid Until" value={formatDate(proposal.valid_until)} />
          {proposal.sent_at && (
            <InfoRow label="Sent" value={formatDate(proposal.sent_at)} />
          )}
          {proposal.viewed_at && (
            <InfoRow label="First Viewed" value={formatDate(proposal.viewed_at)} />
          )}
          {proposal.accepted_at && (
            <InfoRow label="Accepted" value={formatDate(proposal.accepted_at)} />
          )}
          {proposal.declined_at && (
            <InfoRow label="Declined" value={formatDate(proposal.declined_at)} />
          )}
        </Section>

        {/* Financial Breakdown */}
        <Section title="Pricing">
          <InfoRow
            label="Subtotal"
            value={formatCurrency(proposal.subtotal, proposal.currency)}
          />
          {proposal.discount_percent > 0 && (
            <InfoRow
              label={`Discount (${proposal.discount_percent}%)`}
              value={
                <span className="text-error-500">
                  -
                  {formatCurrency(
                    proposal.subtotal * (proposal.discount_percent / 100),
                    proposal.currency
                  )}
                </span>
              }
            />
          )}
          {proposal.tax_percent > 0 && (
            <InfoRow
              label={`Tax (${proposal.tax_percent}%)`}
              value={formatCurrency(
                (proposal.subtotal -
                  proposal.subtotal * (proposal.discount_percent / 100)) *
                  (proposal.tax_percent / 100),
                proposal.currency
              )}
            />
          )}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <InfoRow
              label="Total"
              value={
                <span className="text-lg font-bold">
                  {formatCurrency(proposal.total, proposal.currency)}
                </span>
              }
            />
          </div>
        </Section>

        {/* Notes */}
        {proposal.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {proposal.notes}
            </p>
          </Section>
        )}

        {/* Quick Actions */}
        <Section title="Actions">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
            >
              {copySuccess ? "Link Copied!" : "Copy Shareable Link"}
            </button>
            {proposal.status === "draft" && (
              <button
                onClick={handleSend}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
              >
                Send Proposal
              </button>
            )}
            <button
              onClick={handleDuplicate}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              Duplicate
            </button>
            {proposal.status === "accepted" && !proposal.project_id && (
              <button
                onClick={handleConvertToProject}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
              >
                Convert to Project
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Section>

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(proposal.created_at)}</p>
          <p>Updated: {formatDate(proposal.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default ProposalDetailsSidebar;
