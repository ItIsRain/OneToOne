"use client";

import React from "react";

interface BookingConfirmationProps {
  bookingPage: {
    name: string;
    duration_minutes: number;
    color: string;
  };
  appointment: {
    client_name: string;
    client_email: string;
    start_time: string;
    end_time: string;
  };
  onBookAnother: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hour${hours > 1 ? "s" : ""} ${remaining} min`;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function BookingConfirmation({
  bookingPage,
  appointment,
  onBookAnother,
}: BookingConfirmationProps) {
  return (
    <div className="p-8 text-center">
      {/* Checkmark */}
      <div
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: `${bookingPage.color}15` }}
      >
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke={bookingPage.color}
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        Booking Confirmed!
      </h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Your appointment has been successfully scheduled.
      </p>

      {/* Summary Card */}
      <div className="mx-auto mb-6 max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-5 text-left dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full"
            style={{ backgroundColor: bookingPage.color }}
          />
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Service
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {bookingPage.name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Date &amp; Time
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatDateTime(appointment.start_time)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatTime(appointment.start_time)} -{" "}
                {formatTime(appointment.end_time)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Duration
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatDuration(bookingPage.duration_minutes)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Booked By
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {appointment.client_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {appointment.client_email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        A confirmation email will be sent to{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {appointment.client_email}
        </span>
      </p>

      <button
        onClick={onBookAnother}
        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Book Another
      </button>
    </div>
  );
}
