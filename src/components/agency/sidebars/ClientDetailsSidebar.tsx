"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Client } from "../ClientsTable";

interface ClientDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: (client: Client) => void;
  onDelete?: (id: string) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(status: string): "success" | "warning" | "error" | "primary" {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "error";
    case "archived":
      return "warning";
    default:
      return "primary";
  }
}

function formatIndustry(industry: string | null): string {
  if (!industry) return "-";
  return industry
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const ClientDetailsSidebar: React.FC<ClientDetailsSidebarProps> = ({
  isOpen,
  onClose,
  client,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!client) return null;

  const location = [client.city, client.country].filter(Boolean).join(", ") || "-";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(client.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(client)}
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
      title={client.name}
      subtitle={client.company || "No company"}
      headerActions={headerActions}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={getStatusColor(client.status)}>
              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
            </Badge>
          </div>
          <button
            onClick={() => onEdit(client)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Client
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={2}>
            <StatItem label="Total Events" value={client.events_count || 0} />
            <StatItem
              label="Revenue"
              value={formatRevenue(client.total_revenue || 0)}
              color="text-success-500"
            />
          </StatsGrid>
        </div>

        {/* Contact Information */}
        <Section title="Contact Information">
          <InfoRow
            label="Email"
            value={
              client.email ? (
                <a href={`mailto:${client.email}`} className="text-brand-500 hover:text-brand-600">
                  {client.email}
                </a>
              ) : null
            }
          />
          <InfoRow
            label="Phone"
            value={
              client.phone ? (
                <a href={`tel:${client.phone}`} className="text-brand-500 hover:text-brand-600">
                  {client.phone}
                </a>
              ) : null
            }
          />
          <InfoRow
            label="Website"
            value={
              client.website ? (
                <a
                  href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:text-brand-600"
                >
                  {client.website}
                </a>
              ) : null
            }
          />
          <InfoRow label="Location" value={location} />
          {client.address && <InfoRow label="Address" value={client.address} />}
        </Section>

        {/* Business Information */}
        <Section title="Business Details">
          <InfoRow label="Industry" value={formatIndustry(client.industry)} />
          <InfoRow
            label="Source"
            value={client.source?.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          />
        </Section>

        {/* Tags */}
        {client.tags && client.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag, index) => (
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

        {/* Notes */}
        {client.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {client.notes}
            </p>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(client.created_at)}</p>
          <p>Updated: {formatDate(client.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default ClientDetailsSidebar;
