"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import type { Lead } from "../LeadsTable";

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onEdit: (lead: Lead) => void;
}

function capitalizeName(str: string | null): string {
  if (!str) return "-";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function formatFieldLabel(str: string | null): string {
  if (!str) return "-";
  return str
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  isOpen,
  onClose,
  lead,
  onEdit,
}) => {
  if (!lead) return null;

  const location = [lead.city, lead.country].filter(Boolean).join(", ") || "-";
  const assignedName = lead.assigned_to_profile
    ? `${lead.assigned_to_profile.first_name} ${lead.assigned_to_profile.last_name}`
    : "-";

  // Calculate weighted value (estimated_value * probability / 100)
  const weightedValue = (lead.estimated_value * lead.probability) / 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {capitalizeName(lead.name)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lead.company || "No company"} {lead.job_title && `- ${lead.job_title}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge size="sm" color={getPriorityColor(lead.priority)}>
            {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
          </Badge>
          <Badge size="sm" color={getStatusColor(lead.status)}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Pipeline Summary */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Pipeline Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estimated Value</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {formatValue(lead.estimated_value || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Probability</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {lead.probability}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weighted Value</p>
              <p className="text-lg font-semibold text-brand-500">
                {formatValue(weightedValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lead Score</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {lead.score}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-brand-500 hover:text-brand-600">
                    {lead.email}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-brand-500 hover:text-brand-600">
                    {lead.phone}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Website</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {lead.website ? (
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    {lead.website}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
              <p className="text-sm text-gray-800 dark:text-white/90">{location}</p>
            </div>
            {lead.address && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                <p className="text-sm text-gray-800 dark:text-white/90">{lead.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Company & Industry */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Company Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Industry</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatFieldLabel(lead.industry)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Company Size</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {lead.company_size ? `${lead.company_size} employees` : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget Range</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {lead.budget_range || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
              <p className="text-sm text-gray-800 dark:text-white/90">{assignedName}</p>
            </div>
          </div>
        </div>

        {/* Timeline & Follow-up */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Timeline
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Follow-up</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatDateTime(lead.next_follow_up)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Contacted</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatDateTime(lead.last_contacted)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Close</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatDate(lead.expected_close_date)}
              </p>
            </div>
            {lead.actual_close_date && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actual Close</p>
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {formatDate(lead.actual_close_date)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Source & Attribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
            Source & Attribution
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lead Source</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {formatFieldLabel(lead.source)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Campaign</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {lead.campaign || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referral Source</p>
              <p className="text-sm text-gray-800 dark:text-white/90">
                {lead.referral_source || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Requirements & Pain Points */}
        {(lead.requirements || lead.pain_points || lead.competitor_info) && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Requirements & Insights
            </h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              {lead.requirements && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Requirements</p>
                  <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                    {lead.requirements}
                  </p>
                </div>
              )}
              {lead.pain_points && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pain Points</p>
                  <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                    {lead.pain_points}
                  </p>
                </div>
              )}
              {lead.competitor_info && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Competitor Information</p>
                  <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                    {lead.competitor_info}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lost Reason */}
        {lead.status === "lost" && lead.lost_reason && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Lost Reason
            </h4>
            <div className="bg-error-50 dark:bg-error-500/10 rounded-lg p-4">
              <p className="text-sm text-error-600 dark:text-error-400 whitespace-pre-wrap">
                {lead.lost_reason}
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Notes
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          </div>
        )}

        {/* Tags & Services */}
        {(lead.tags?.length || lead.services_interested?.length) && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-3">
              Tags & Services
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              {lead.tags && lead.tags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {lead.services_interested && lead.services_interested.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Services Interested</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.services_interested.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Created: {formatDate(lead.created_at)}</span>
            <span>Last updated: {formatDate(lead.updated_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onEdit(lead);
          }}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          Edit Lead
        </button>
      </div>
    </Modal>
  );
};
