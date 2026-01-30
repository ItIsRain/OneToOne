"use client";

import React, { useState } from "react";

interface BookingFormProps {
  bookingPage: {
    name: string;
    color: string;
    duration_minutes: number;
  };
  selectedDate: string;
  selectedStartTime: string;
  selectedEndTime: string;
  onSubmit: (data: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  }) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function formatTime12h(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BookingForm({
  bookingPage,
  selectedDate,
  selectedStartTime,
  selectedEndTime,
  onSubmit,
  onBack,
  isSubmitting,
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="p-6">
      {/* Selected time summary */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-1 rounded-full"
            style={{ backgroundColor: bookingPage.color }}
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {bookingPage.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(selectedDate)} at {formatTime12h(selectedStartTime)} -{" "}
              {formatTime12h(selectedEndTime)}
            </p>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
        Your Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="booking-name"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="booking-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            style={
              {
                "--tw-ring-color": bookingPage.color,
              } as React.CSSProperties
            }
          />
        </div>

        <div>
          <label
            htmlFor="booking-email"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="booking-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            style={
              {
                "--tw-ring-color": bookingPage.color,
              } as React.CSSProperties
            }
          />
        </div>

        <div>
          <label
            htmlFor="booking-phone"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Phone{" "}
            <span className="text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <input
            id="booking-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            style={
              {
                "--tw-ring-color": bookingPage.color,
              } as React.CSSProperties
            }
          />
        </div>

        <div>
          <label
            htmlFor="booking-notes"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Notes{" "}
            <span className="text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <textarea
            id="booking-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything you'd like us to know..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            style={
              {
                "--tw-ring-color": bookingPage.color,
              } as React.CSSProperties
            }
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            &larr; Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !email.trim()}
            className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: bookingPage.color }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Booking...
              </span>
            ) : (
              "Confirm Booking"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
