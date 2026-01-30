"use client";
import React, { useState, useEffect } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Vendor } from "../VendorsTable";

interface VendorDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onEdit: (vendor: Vendor) => void;
  onDelete?: (id: string) => void;
}

interface VendorEvent {
  id: string;
  event_id: string;
  vendor_id: string;
  role: string | null;
  agreed_rate: number | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  event: {
    id: string;
    title: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
  } | null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRate(amount: number | null): string {
  if (amount === null || amount === undefined) return "-";
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

function getEventStatusColor(status: string): "success" | "warning" | "error" | "primary" {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "primary";
  }
}

export const VendorDetailsSidebar: React.FC<VendorDetailsSidebarProps> = ({
  isOpen,
  onClose,
  vendor,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignedEvents, setAssignedEvents] = useState<VendorEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    if (vendor?.id) {
      setEventsLoading(true);
      fetch(`/api/vendors/${vendor.id}/events`)
        .then((res) => res.json())
        .then((data) => {
          setAssignedEvents(data.events || []);
        })
        .catch(() => {
          setAssignedEvents([]);
        })
        .finally(() => {
          setEventsLoading(false);
        });
    } else {
      setAssignedEvents([]);
    }
  }, [vendor?.id]);

  if (!vendor) return null;

  const location = [vendor.city, vendor.country].filter(Boolean).join(", ") || "-";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(vendor.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(vendor)}
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
      title={vendor.name}
      subtitle={vendor.company || "No company"}
      headerActions={headerActions}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={getStatusColor(vendor.status)}>
              {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
            </Badge>
          </div>
          <button
            onClick={() => onEdit(vendor)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Vendor
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={2}>
            <StatItem label="Events Count" value={vendor.events_count || 0} />
            <StatItem
              label="Hourly Rate"
              value={formatRate(vendor.hourly_rate)}
              color="text-success-500"
            />
          </StatsGrid>
        </div>

        {/* Contact Information */}
        <Section title="Contact Information">
          <InfoRow
            label="Email"
            value={
              vendor.email ? (
                <a href={`mailto:${vendor.email}`} className="text-brand-500 hover:text-brand-600">
                  {vendor.email}
                </a>
              ) : null
            }
          />
          <InfoRow
            label="Phone"
            value={
              vendor.phone ? (
                <a href={`tel:${vendor.phone}`} className="text-brand-500 hover:text-brand-600">
                  {vendor.phone}
                </a>
              ) : null
            }
          />
          <InfoRow
            label="Website"
            value={
              vendor.website ? (
                <a
                  href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:text-brand-600"
                >
                  {vendor.website}
                </a>
              ) : null
            }
          />
          <InfoRow label="Location" value={location} />
          {vendor.address && <InfoRow label="Address" value={vendor.address} />}
        </Section>

        {/* Vendor Details */}
        <Section title="Vendor Details">
          <InfoRow
            label="Category"
            value={
              vendor.category ? (
                <Badge size="sm" color="primary">
                  {vendor.category}
                </Badge>
              ) : (
                "-"
              )
            }
          />
          <InfoRow
            label="Rating"
            value={
              vendor.rating !== null && vendor.rating !== undefined
                ? `${vendor.rating.toFixed(1)} \u2605`
                : "-"
            }
          />
          <InfoRow
            label="Status"
            value={
              <Badge size="sm" color={getStatusColor(vendor.status)}>
                {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
              </Badge>
            }
          />
        </Section>

        {/* Services */}
        {vendor.services && vendor.services.length > 0 && (
          <Section title="Services">
            <div className="flex flex-wrap gap-2">
              {vendor.services.map((service, index) => (
                <span
                  key={index}
                  className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                >
                  {service}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Assigned Events */}
        <Section title="Assigned Events">
          {eventsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          ) : assignedEvents.length > 0 ? (
            <div className="space-y-3">
              {assignedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {ev.event?.title || "Untitled Event"}
                    </p>
                    {ev.role && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Role: {ev.role}
                      </p>
                    )}
                  </div>
                  {ev.status && (
                    <Badge size="sm" color={getEventStatusColor(ev.status)}>
                      {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No events assigned yet.
            </p>
          )}
        </Section>

        {/* Tags */}
        {vendor.tags && vendor.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {vendor.tags.map((tag, index) => (
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
        {vendor.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {vendor.notes}
            </p>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(vendor.created_at)}</p>
          <p>Updated: {formatDate(vendor.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default VendorDetailsSidebar;
