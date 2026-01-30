"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Appointment } from "../AppointmentsTable";

interface AppointmentDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onStatusChange?: (appointment: Appointment) => void;
}

const statusColors: Record<string, "success" | "error" | "primary" | "warning"> = {
  confirmed: "success",
  cancelled: "error",
  completed: "primary",
  no_show: "warning",
  rescheduled: "warning",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No Show",
  rescheduled: "Rescheduled",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateDuration(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / (1000 * 60));
}

export const AppointmentDetailsSidebar: React.FC<AppointmentDetailsSidebarProps> = ({
  isOpen,
  onClose,
  appointment,
  onStatusChange,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!appointment) return null;

  const duration = calculateDuration(appointment.start_time, appointment.end_time);

  const handleUpdateStatus = async (newStatus: "completed" | "cancelled" | "no_show") => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update appointment");
      }

      if (onStatusChange) {
        onStatusChange(data.appointment);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update appointment");
    } finally {
      setIsUpdating(false);
    }
  };

  const headerActions = (
    <>
      {appointment.status === "confirmed" && (
        <button
          onClick={() => handleUpdateStatus("completed")}
          disabled={isUpdating}
          className="rounded-lg p-2 text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10 transition-colors disabled:opacity-50"
          title="Mark Complete"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      )}
      {appointment.status !== "cancelled" && appointment.status !== "completed" && (
        <button
          onClick={() => handleUpdateStatus("cancelled")}
          disabled={isUpdating}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title="Cancel"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={appointment.client_name}
      subtitle={appointment.booking_page?.name || "Appointment"}
      headerActions={headerActions}
      footer={
        <div className="flex items-center justify-between">
          <Badge size="sm" color={statusColors[appointment.status] || "primary"}>
            {statusLabels[appointment.status] || appointment.status}
          </Badge>
          <div className="flex items-center gap-2">
            {appointment.status === "confirmed" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("completed")}
                  disabled={isUpdating}
                  className="rounded-lg bg-success-500 px-3 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors disabled:opacity-50"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={isUpdating}
                  className="rounded-lg border border-error-300 px-3 py-2 text-sm font-medium text-error-500 hover:bg-error-50 dark:border-error-700 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={2}>
            <StatItem label="Duration" value={`${duration} min`} />
            <StatItem
              label="Status"
              value={statusLabels[appointment.status] || appointment.status}
              color={
                appointment.status === "confirmed"
                  ? "text-success-500"
                  : appointment.status === "cancelled"
                  ? "text-error-500"
                  : appointment.status === "completed"
                  ? "text-brand-500"
                  : "text-warning-500"
              }
            />
          </StatsGrid>
        </div>

        {/* Client Info */}
        <Section title="Client Information">
          <InfoRow label="Name" value={appointment.client_name} />
          <InfoRow
            label="Email"
            value={
              <a href={`mailto:${appointment.client_email}`} className="text-brand-500 hover:text-brand-600">
                {appointment.client_email}
              </a>
            }
          />
          <InfoRow
            label="Phone"
            value={
              appointment.client_phone ? (
                <a href={`tel:${appointment.client_phone}`} className="text-brand-500 hover:text-brand-600">
                  {appointment.client_phone}
                </a>
              ) : (
                "-"
              )
            }
          />
        </Section>

        {/* Appointment Details */}
        <Section title="Appointment Details">
          <InfoRow
            label="Booking Page"
            value={appointment.booking_page?.name || "-"}
          />
          <InfoRow label="Date" value={formatDate(appointment.start_time)} />
          <InfoRow
            label="Time"
            value={`${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`}
          />
          <InfoRow label="Source" value={appointment.source || "-"} />
        </Section>

        {/* Cancellation Reason */}
        {appointment.cancellation_reason && (
          <Section title="Cancellation Reason">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {appointment.cancellation_reason}
            </p>
          </Section>
        )}

        {/* Notes */}
        {appointment.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {appointment.notes}
            </p>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(appointment.created_at)}</p>
          <p>Updated: {formatDate(appointment.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default AppointmentDetailsSidebar;
