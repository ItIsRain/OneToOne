"use client";
import React, { useState, useEffect } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { BookingPage } from "../BookingPagesTable";

interface BookingPageDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bookingPage: BookingPage | null;
  onEdit: (bookingPage: BookingPage) => void;
  onDelete?: (id: string) => void;
}

const locationLabels: Record<string, string> = {
  video: "Video Call",
  phone: "Phone Call",
  in_person: "In Person",
  custom: "Custom",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const BookingPageDetailsSidebar: React.FC<BookingPageDetailsSidebarProps> = ({
  isOpen,
  onClose,
  bookingPage,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [countLoading, setCountLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  useEffect(() => {
    if (bookingPage?.id) {
      setCountLoading(true);
      fetch(`/api/booking-pages/${bookingPage.id}/appointments-count`)
        .then((res) => res.json())
        .then((data) => {
          setAppointmentCount(data.count || 0);
        })
        .catch(() => {
          setAppointmentCount(0);
        })
        .finally(() => {
          setCountLoading(false);
        });
    } else {
      setAppointmentCount(0);
    }
  }, [bookingPage?.id]);

  if (!bookingPage) return null;

  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${bookingPage.slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      alert(`Booking URL: ${bookingUrl}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this booking page?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(bookingPage.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    setIsTogglingActive(true);
    try {
      const res = await fetch(`/api/booking-pages/${bookingPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !bookingPage.is_active }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update booking page");
      }

      const data = await res.json();
      onEdit(data.bookingPage);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setIsTogglingActive(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={handleCopyLink}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Copy booking link"
      >
        {copiedLink ? (
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
        onClick={() => onEdit(bookingPage)}
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
      title={bookingPage.name}
      subtitle={`/book/${bookingPage.slug}`}
      headerActions={headerActions}
      footer={
        <div className="flex items-center justify-between">
          <Badge size="sm" color={bookingPage.is_active ? "success" : "error"}>
            {bookingPage.is_active ? "Active" : "Inactive"}
          </Badge>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleActive}
              disabled={isTogglingActive}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isTogglingActive
                ? "..."
                : bookingPage.is_active
                ? "Deactivate"
                : "Activate"}
            </button>
            <button
              onClick={() => onEdit(bookingPage)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Edit Page
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={2}>
            <StatItem
              label="Total Appointments"
              value={countLoading ? "..." : appointmentCount}
            />
            <StatItem
              label="Status"
              value={bookingPage.is_active ? "Active" : "Inactive"}
              color={bookingPage.is_active ? "text-success-500" : "text-error-500"}
            />
          </StatsGrid>
        </div>

        {/* Details */}
        <Section title="Details">
          <InfoRow label="Name" value={bookingPage.name} />
          <InfoRow label="Slug" value={bookingPage.slug} />
          <InfoRow label="Duration" value={`${bookingPage.duration_minutes} minutes`} />
          <InfoRow label="Buffer Before" value={`${bookingPage.buffer_before} min`} />
          <InfoRow label="Buffer After" value={`${bookingPage.buffer_after} min`} />
          <InfoRow
            label="Location"
            value={locationLabels[bookingPage.location_type] || bookingPage.location_type}
          />
          {bookingPage.location_details && (
            <InfoRow label="Location Details" value={bookingPage.location_details} />
          )}
          <InfoRow label="Min Notice" value={`${bookingPage.min_notice_hours} hours`} />
          <InfoRow label="Max Advance" value={`${bookingPage.max_advance_days} days`} />
          <InfoRow
            label="Color"
            value={
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: bookingPage.color }}
                />
                <span>{bookingPage.color}</span>
              </div>
            }
          />
        </Section>

        {/* Booking Link */}
        <Section title="Booking Link">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300 break-all">
              {bookingUrl}
            </code>
            <button
              onClick={handleCopyLink}
              className="shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
            >
              {copiedLink ? "Copied!" : "Copy"}
            </button>
          </div>
        </Section>

        {/* Description */}
        {bookingPage.description && (
          <Section title="Description">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {bookingPage.description}
            </p>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(bookingPage.created_at)}</p>
          <p>Updated: {formatDate(bookingPage.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default BookingPageDetailsSidebar;
