"use client";

import React from "react";

interface ServiceInfoProps {
  bookingPage: {
    name: string;
    description: string | null;
    duration_minutes: number;
    location_type: "video" | "phone" | "in_person" | "custom";
    location_details: string | null;
    color: string;
  };
}

function LocationIcon({ type }: { type: string }) {
  switch (type) {
    case "video":
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      );
    case "phone":
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      );
    case "in_person":
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      );
  }
}

function formatLocationType(type: string): string {
  switch (type) {
    case "video":
      return "Video Call";
    case "phone":
      return "Phone Call";
    case "in_person":
      return "In Person";
    case "custom":
      return "Custom Location";
    default:
      return type;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hour${hours > 1 ? "s" : ""} ${remaining} min`;
}

export function ServiceInfo({ bookingPage }: ServiceInfoProps) {
  return (
    <div className="flex overflow-hidden rounded-t-xl">
      <div className="w-1.5 shrink-0" style={{ backgroundColor: bookingPage.color }} />
      <div className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {bookingPage.name}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatDuration(bookingPage.duration_minutes)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <LocationIcon type={bookingPage.location_type} />
            <span>
              {bookingPage.location_type === "custom" && bookingPage.location_details
                ? bookingPage.location_details
                : formatLocationType(bookingPage.location_type)}
            </span>
          </div>
        </div>

        {bookingPage.description && (
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {bookingPage.description}
          </p>
        )}
      </div>
    </div>
  );
}
