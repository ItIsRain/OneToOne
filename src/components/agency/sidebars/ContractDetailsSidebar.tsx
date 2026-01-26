"use client";
import React, { useState, useEffect } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { ContractRecord } from "../ContractsTable";

interface ContractActivity {
  id: string;
  action: string;
  description: string;
  changes?: Record<string, unknown>;
  performed_by: string;
  created_at: string;
}

interface ContractDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractRecord | null;
  onEdit: (contract: ContractRecord) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (contract: ContractRecord, newStatus: string) => void;
  onSign?: (contract: ContractRecord) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number | null, currency: string = "USD"): string {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  pending_review: { label: "Pending Review", color: "warning" },
  pending_signature: { label: "Pending Signature", color: "warning" },
  active: { label: "Active", color: "success" },
  expired: { label: "Expired", color: "error" },
  terminated: { label: "Terminated", color: "error" },
  cancelled: { label: "Cancelled", color: "light" },
  on_hold: { label: "On Hold", color: "warning" },
};

const contractTypeLabels: Record<string, string> = {
  service_agreement: "Service Agreement",
  project_contract: "Project Contract",
  retainer: "Retainer Agreement",
  nda: "Non-Disclosure Agreement",
  partnership: "Partnership Agreement",
  employment: "Employment Contract",
  vendor: "Vendor Agreement",
  licensing: "Licensing Agreement",
  other: "Other",
};

const paymentTermsLabels: Record<string, string> = {
  on_receipt: "Due on Receipt",
  net_15: "Net 15 Days",
  net_30: "Net 30 Days",
  net_45: "Net 45 Days",
  net_60: "Net 60 Days",
  net_90: "Net 90 Days",
  milestone: "Milestone-based",
  custom: "Custom Terms",
};

const renewalPeriodLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
  biennial: "Biennial (2 Years)",
};

export const ContractDetailsSidebar: React.FC<ContractDetailsSidebarProps> = ({
  isOpen,
  onClose,
  contract,
  onEdit,
  onDelete,
  onStatusChange,
  onSign,
}) => {
  const [activities, setActivities] = useState<ContractActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch contract details and activities
  useEffect(() => {
    const fetchDetails = async () => {
      if (!contract?.id || !isOpen) return;

      setLoadingActivities(true);
      try {
        const res = await fetch(`/api/documents/contracts/${contract.id}`);
        const data = await res.json();
        if (res.ok) {
          setActivities(data.activities || []);
        }
      } catch {
        console.error("Failed to fetch contract details");
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchDetails();
  }, [contract?.id, isOpen]);

  if (!contract) return null;

  const status = statusConfig[contract.status] || statusConfig.draft;

  // Calculate days until expiry
  const daysUntilExpiry = contract.end_date
    ? Math.ceil((new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contract?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(contract.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(contract)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {contract.document_url && (
        <a
          href={contract.document_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Download Document"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      )}
      {onDelete && (
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
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>{contract.name}</span>
          {contract.is_signed && (
            <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </div>
      }
      subtitle={contract.contract_number || undefined}
      headerActions={headerActions}
      width="xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
            {contract.auto_renew && (
              <Badge size="sm" color="primary">
                Auto-Renew
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {contract.status === "pending_signature" && !contract.is_signed && onSign && (
              <button
                onClick={() => onSign(contract)}
                className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors"
              >
                Sign Contract
              </button>
            )}
            <button
              onClick={() => onEdit(contract)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Edit Contract
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={3}>
            <StatItem
              label="Contract Value"
              value={formatCurrency(contract.value, contract.currency)}
            />
            <StatItem
              label="Days Remaining"
              value={daysUntilExpiry !== null ? (isExpired ? "Expired" : daysUntilExpiry) : "N/A"}
              color={isExpired ? "text-error-500" : isExpiringSoon ? "text-warning-500" : "text-gray-800 dark:text-white"}
            />
            <StatItem
              label="Signed"
              value={contract.is_signed ? "Yes" : "No"}
              color={contract.is_signed ? "text-success-500" : "text-gray-500"}
            />
          </StatsGrid>
        </div>

        {/* Contract Details */}
        <Section title="Contract Details">
          <InfoRow label="Contract Number" value={contract.contract_number} />
          <InfoRow label="Type" value={contractTypeLabels[contract.contract_type] || contract.contract_type} />
          <InfoRow label="Category" value={contract.category ? contract.category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : null} />
          <InfoRow label="Start Date" value={formatDate(contract.start_date)} />
          <InfoRow
            label="End Date"
            value={
              <span className={isExpired ? "text-error-500 font-medium" : isExpiringSoon ? "text-warning-500 font-medium" : ""}>
                {formatDate(contract.end_date)}
                {isExpiringSoon && !isExpired && " (Expiring Soon)"}
                {isExpired && " (Expired)"}
              </span>
            }
          />
          <InfoRow label="Status" value={<Badge size="sm" color={status.color}>{status.label}</Badge>} />
        </Section>

        {/* Client Information */}
        {contract.client && (
          <Section title="Client">
            <InfoRow label="Name" value={contract.client.name} />
            {contract.client.company && (
              <InfoRow label="Company" value={contract.client.company} />
            )}
            {contract.client.email && (
              <InfoRow
                label="Email"
                value={
                  <a href={`mailto:${contract.client.email}`} className="text-brand-500 hover:text-brand-600">
                    {contract.client.email}
                  </a>
                }
              />
            )}
          </Section>
        )}

        {/* Project Information */}
        {contract.project && (
          <Section title="Project">
            <InfoRow label="Project Name" value={contract.project.name} />
            {contract.project.project_code && (
              <InfoRow label="Project Code" value={contract.project.project_code} />
            )}
          </Section>
        )}

        {/* Financial Details */}
        <Section title="Financial">
          <InfoRow label="Contract Value" value={formatCurrency(contract.value, contract.currency)} />
          <InfoRow label="Currency" value={contract.currency} />
          <InfoRow label="Payment Terms" value={contract.payment_terms ? paymentTermsLabels[contract.payment_terms] || contract.payment_terms : null} />
        </Section>

        {/* Renewal Settings */}
        {contract.auto_renew && (
          <Section title="Renewal">
            <InfoRow label="Auto-Renewal" value={contract.auto_renew ? "Enabled" : "Disabled"} />
            <InfoRow label="Renewal Period" value={contract.renewal_period ? renewalPeriodLabels[contract.renewal_period] || contract.renewal_period : null} />
          </Section>
        )}

        {/* Signature Information */}
        {contract.signature_required && (
          <Section title="Signature">
            <InfoRow label="Signature Required" value={contract.signature_required ? "Yes" : "No"} />
            <InfoRow
              label="Signed"
              value={
                contract.is_signed ? (
                  <span className="text-success-500 font-medium">
                    Yes - {formatDate(contract.signed_date)}
                  </span>
                ) : (
                  "No"
                )
              }
            />
            {contract.signatory_name && <InfoRow label="Signatory" value={contract.signatory_name} />}
            {contract.signatory_email && (
              <InfoRow
                label="Signatory Email"
                value={
                  <a href={`mailto:${contract.signatory_email}`} className="text-brand-500 hover:text-brand-600">
                    {contract.signatory_email}
                  </a>
                }
              />
            )}
          </Section>
        )}

        {/* Description */}
        {contract.description && (
          <Section title="Description">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {contract.description}
            </p>
          </Section>
        )}

        {/* Status Actions */}
        {onStatusChange && !["expired", "terminated", "cancelled"].includes(contract.status) && (
          <Section title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              {contract.status === "draft" && (
                <>
                  <button
                    onClick={() => onStatusChange(contract, "pending_review")}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
                  >
                    Submit for Review
                  </button>
                  <button
                    onClick={() => onStatusChange(contract, "pending_signature")}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/20 transition-colors"
                  >
                    Send for Signature
                  </button>
                </>
              )}
              {contract.status === "pending_review" && (
                <button
                  onClick={() => onStatusChange(contract, "pending_signature")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/20 transition-colors"
                >
                  Approve & Send for Signature
                </button>
              )}
              {(contract.status === "pending_signature" || contract.status === "pending_review") && (
                <button
                  onClick={() => onStatusChange(contract, "draft")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  Return to Draft
                </button>
              )}
              {contract.status === "pending_signature" && contract.is_signed && (
                <button
                  onClick={() => onStatusChange(contract, "active")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
                >
                  Activate Contract
                </button>
              )}
              {contract.status === "active" && (
                <>
                  <button
                    onClick={() => onStatusChange(contract, "on_hold")}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/20 transition-colors"
                  >
                    Put On Hold
                  </button>
                  <button
                    onClick={() => onStatusChange(contract, "terminated")}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 transition-colors"
                  >
                    Terminate Contract
                  </button>
                </>
              )}
              {contract.status === "on_hold" && (
                <button
                  onClick={() => onStatusChange(contract, "active")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
                >
                  Resume Contract
                </button>
              )}
            </div>
          </Section>
        )}

        {/* Tags */}
        {contract.tags && contract.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {contract.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Activity Timeline */}
        <Section title="Activity History">
          {loadingActivities ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {activity.action === "created" && (
                      <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    {activity.action === "updated" && (
                      <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                    {activity.action === "signed" && (
                      <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                    {activity.action === "status_changed" && (
                      <svg className="w-4 h-4 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                    {!["created", "updated", "signed", "status_changed"].includes(activity.action) && (
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-white/90">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
          )}
        </Section>

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(contract.created_at)}</p>
          <p>Updated: {formatDate(contract.updated_at)}</p>
          {contract.signed_date && <p>Signed: {formatDate(contract.signed_date)}</p>}
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default ContractDetailsSidebar;
