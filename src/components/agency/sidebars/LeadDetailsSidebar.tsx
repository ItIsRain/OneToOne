"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Lead } from "../LeadsTable";

interface LeadDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onEdit: (lead: Lead) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatValue(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(status: string): "success" | "warning" | "error" | "primary" | "light" {
  switch (status) {
    case "won":
      return "success";
    case "lost":
      return "error";
    case "proposal":
    case "negotiation":
      return "primary";
    case "qualified":
      return "warning";
    default:
      return "light";
  }
}

function getPriorityColor(priority: string): "success" | "warning" | "error" | "primary" {
  switch (priority) {
    case "urgent":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "primary";
    default:
      return "success";
  }
}

const statusSteps = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
];

export const LeadDetailsSidebar: React.FC<LeadDetailsSidebarProps> = ({
  isOpen,
  onClose,
  lead,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!lead) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(lead.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!onStatusChange) return;
    setIsUpdating(true);
    try {
      onStatusChange(lead.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusIndex = statusSteps.findIndex(s => s.key === lead.status);

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(lead)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
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
      title={lead.name}
      subtitle={lead.company || ""}
      headerActions={headerActions}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={getStatusColor(lead.status)}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            <Badge size="sm" color={getPriorityColor(lead.priority)}>
              {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
            </Badge>
          </div>
          <button
            onClick={() => onEdit(lead)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Lead
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Value & Probability Stats */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={3}>
            <StatItem
              label="Est. Value"
              value={formatValue(lead.estimated_value || 0)}
              color="text-success-500"
            />
            <StatItem
              label="Probability"
              value={`${lead.probability || 0}%`}
              color="text-brand-500"
            />
            <StatItem
              label="Score"
              value={lead.score || 0}
            />
          </StatsGrid>
        </div>

        {/* Status Pipeline */}
        {lead.status !== "lost" && (
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Pipeline Status</h4>
            <div className="flex items-center gap-1">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = step.key === lead.status;
                return (
                  <React.Fragment key={step.key}>
                    <button
                      onClick={() => handleStatusUpdate(step.key)}
                      disabled={isUpdating}
                      className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                        isCurrent
                          ? "bg-brand-500 text-white ring-2 ring-brand-500/30"
                          : isCompleted
                          ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {step.label}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => handleStatusUpdate("lost")}
                disabled={isUpdating}
                className="text-xs text-error-500 hover:text-error-600"
              >
                Mark as Lost
              </button>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <Section title="Contact Information">
          <InfoRow
            label="Email"
            value={
              lead.email ? (
                <a href={`mailto:${lead.email}`} className="text-brand-500 hover:text-brand-600">
                  {lead.email}
                </a>
              ) : null
            }
          />
          <InfoRow
            label="Phone"
            value={
              lead.phone ? (
                <a href={`tel:${lead.phone}`} className="text-brand-500 hover:text-brand-600">
                  {lead.phone}
                </a>
              ) : null
            }
          />
          <InfoRow label="Job Title" value={lead.job_title} />
          <InfoRow
            label="Website"
            value={
              lead.website ? (
                <a
                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:text-brand-600"
                >
                  {lead.website}
                </a>
              ) : null
            }
          />
        </Section>

        {/* Company Details */}
        <Section title="Company Details">
          <InfoRow label="Company" value={lead.company} />
          <InfoRow
            label="Industry"
            value={lead.industry?.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          />
          <InfoRow label="Company Size" value={lead.company_size} />
          <InfoRow label="Budget Range" value={lead.budget_range} />
          <InfoRow
            label="Location"
            value={[lead.city, lead.country].filter(Boolean).join(", ")}
          />
        </Section>

        {/* Lead Source */}
        <Section title="Lead Source">
          <InfoRow
            label="Source"
            value={lead.source?.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          />
          <InfoRow label="Campaign" value={lead.campaign} />
          <InfoRow label="Referral" value={lead.referral_source} />
        </Section>

        {/* Timeline */}
        <Section title="Timeline">
          <InfoRow label="Next Follow-up" value={formatDate(lead.next_follow_up)} />
          <InfoRow label="Last Contacted" value={formatDate(lead.last_contacted)} />
          <InfoRow label="Expected Close" value={formatDate(lead.expected_close_date)} />
          {lead.actual_close_date && (
            <InfoRow label="Closed On" value={formatDate(lead.actual_close_date)} />
          )}
        </Section>

        {/* Services Interested */}
        {lead.services_interested && lead.services_interested.length > 0 && (
          <Section title="Services Interested">
            <div className="flex flex-wrap gap-2">
              {lead.services_interested.map((service, index) => (
                <span
                  key={index}
                  className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                >
                  {service}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag, index) => (
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

        {/* Requirements & Pain Points */}
        {(lead.requirements || lead.pain_points) && (
          <Section title="Requirements & Pain Points">
            {lead.requirements && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Requirements</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.requirements}</p>
              </div>
            )}
            {lead.pain_points && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pain Points</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.pain_points}</p>
              </div>
            )}
          </Section>
        )}

        {/* Notes */}
        {lead.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {lead.notes}
            </p>
          </Section>
        )}

        {/* Lost Reason */}
        {lead.status === "lost" && lead.lost_reason && (
          <Section title="Lost Reason">
            <p className="text-sm text-error-600 dark:text-error-400">
              {lead.lost_reason}
            </p>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(lead.created_at)}</p>
          <p>Updated: {formatDate(lead.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default LeadDetailsSidebar;
