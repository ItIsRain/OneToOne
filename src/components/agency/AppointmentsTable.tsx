"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { AppointmentDetailsSidebar } from "./sidebars";

export interface Appointment {
  id: string;
  booking_page_id: string;
  assigned_member_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed" | "no_show" | "rescheduled";
  form_response_id: string | null;
  lead_id: string | null;
  source: string;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  booking_page?: { name: string; slug: string; duration_minutes: number };
}

type TabFilter = "all" | "upcoming" | "past" | "cancelled";

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

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateDuration(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / (1000 * 60));
}

export const AppointmentsTable = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async (tab: TabFilter) => {
    setLoading(true);
    try {
      let url = "/api/appointments";
      const params = new URLSearchParams();

      if (tab === "upcoming") {
        params.set("upcoming", "true");
      } else if (tab === "past") {
        params.set("past", "true");
      } else if (tab === "cancelled") {
        params.set("status", "cancelled");
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        // Try to parse error message, fallback to status text
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || "Failed to fetch appointments");
      }

      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(activeTab);
  }, [activeTab, fetchAppointments]);

  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setViewingAppointment(appointment);
  };

  const handleStatusChange = (updatedAppointment: Appointment) => {
    setAppointments(appointments.map(a =>
      a.id === updatedAppointment.id ? updatedAppointment : a
    ));
    setViewingAppointment(updatedAppointment);
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ];

  if (error && !loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button
          onClick={() => fetchAppointments(activeTab)}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Appointments
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {appointments.length} {appointments.length === 1 ? "appointment" : "appointments"}
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No appointments found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {activeTab === "cancelled"
                ? "No cancelled appointments."
                : activeTab === "upcoming"
                ? "No upcoming appointments scheduled."
                : activeTab === "past"
                ? "No past appointments."
                : "Appointments will appear here once clients book through your booking pages."}
            </p>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Client
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Booking Page
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Date/Time
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Duration
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="py-3">
                      <div>
                        <button
                          onClick={() => handleViewAppointment(appointment)}
                          className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                        >
                          {appointment.client_name}
                        </button>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {appointment.client_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {appointment.booking_page?.name || "-"}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDateTime(appointment.start_time)}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {appointment.booking_page?.duration_minutes
                        ? `${appointment.booking_page.duration_minutes} min`
                        : `${calculateDuration(appointment.start_time, appointment.end_time)} min`}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={statusColors[appointment.status] || "primary"}
                      >
                        {statusLabels[appointment.status] || appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <button
                        onClick={() => handleViewAppointment(appointment)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AppointmentDetailsSidebar
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        appointment={viewingAppointment}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};
