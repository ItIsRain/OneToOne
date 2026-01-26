"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getEventTypeConfig, getPublicFields } from "@/config/eventTypeSchema";
import type { FormField } from "@/config/eventTypeSchema";
import RegistrationModal from "@/components/events/RegistrationModal";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_type: string;
  category: string;
  icon: string | null;
  color: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string | null;
  location: string | null;
  is_virtual: boolean;
  virtual_platform: string | null;
  virtual_link: string | null;
  attendees_count: number;
  max_attendees: number | null;
  is_public: boolean;
  registration_required: boolean;
  registration_deadline: string | null;
  ticket_price: number | null;
  currency: string | null;
  tags: string[];
  cover_image: string | null;
  organizer_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  requirements: Record<string, unknown> | null;
}

// SVG Icons
const Icons = {
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  location: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  ticket: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  live: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  lock: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  code: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  tools: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  handshake: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  ),
  gamepad: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  rocket: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  microphone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  gift: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  presentation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  building: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  clipboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  academic: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
};

// Event type icon mapping
const eventTypeIcons: Record<string, React.ReactNode> = {
  general: Icons.calendar,
  hackathon: Icons.code,
  workshop: Icons.tools,
  meetup: Icons.handshake,
  game_jam: Icons.gamepad,
  demo_day: Icons.rocket,
};

// Tab icon mapping
const tabIconMap: Record<string, React.ReactNode> = {
  details: Icons.document,
  challenges: Icons.target,
  teams: Icons.users,
  prizes: Icons.trophy,
  schedule: Icons.calendar,
  content: Icons.book,
  requirements: Icons.clipboard,
  instructor: Icons.academic,
  agenda: Icons.clipboard,
  speakers: Icons.microphone,
  networking: Icons.gift,
  theme: Icons.target,
  format: Icons.presentation,
  companies: Icons.building,
  audience: Icons.users,
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeString: string | null) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Component to render a single field value based on its type
const FieldValue: React.FC<{
  field: FormField;
  value: unknown;
  eventColor: string;
}> = ({ field, value, eventColor }) => {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value) && value.length === 0) return null;

  switch (field.type) {
    case "toggle":
      return (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              value ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {value ? Icons.check : Icons.x}
            {value ? "Yes" : "No"}
          </span>
        </div>
      );

    case "sortable-list":
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                className="w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0"
                style={{ backgroundColor: eventColor }}
              />
              <span className="text-gray-700 dark:text-gray-300">{String(item)}</span>
            </li>
          ))}
        </ul>
      );

    case "key-value-list":
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <div className="space-y-3">
          {value.map((item, index) => {
            const kvItem = item as { key?: string; value?: string };
            if (!kvItem.key && !kvItem.value) return null;
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{kvItem.key}</p>
                  {kvItem.value && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{kvItem.value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    case "person-list":
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {value.map((person, index) => {
            const p = person as { name?: string; role?: string; company?: string; email?: string };
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                  style={{ backgroundColor: eventColor }}
                >
                  {(p.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{p.name || "Unknown"}</p>
                  {(p.role || p.company) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {[p.role, p.company].filter(Boolean).join(" at ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    case "multiselect":
      if (!Array.isArray(value) || value.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => {
            const option = field.options?.find(opt => opt.value === item);
            const label = option?.label || String(item).replace(/_/g, " ");
            return (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                {label}
              </span>
            );
          })}
        </div>
      );

    case "select":
      const selectedOption = field.options?.find(opt => opt.value === value);
      const displayLabel = selectedOption?.label || String(value).replace(/_/g, " ");
      return (
        <span
          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
        >
          {displayLabel}
        </span>
      );

    case "datetime":
      return (
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          {formatDateTime(String(value))}
        </p>
      );

    case "number":
      return (
        <p className="text-gray-700 dark:text-gray-300 text-xl font-bold">
          {String(value)}
        </p>
      );

    case "currency":
      const amount = typeof value === "number" ? value : parseFloat(String(value));
      return (
        <p className="text-gray-700 dark:text-gray-300 text-xl font-bold">
          ${amount.toLocaleString()}
        </p>
      );

    case "url":
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm hover:underline break-all"
          style={{ color: eventColor }}
        >
          {String(value)}
          {Icons.arrowRight}
        </a>
      );

    case "textarea":
    case "rich-text":
      return (
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {String(value)}
        </p>
      );

    default:
      return (
        <p className="text-gray-700 dark:text-gray-300">{String(value)}</p>
      );
  }
};

// Group fields by their tabs for organized display
interface FieldSection {
  title: string;
  icon: React.ReactNode;
  fields: { field: FormField; value: unknown }[];
}

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/public/${slug}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 404) {
            setError("Event not found");
          } else if (response.status === 403) {
            setError(errorData.error || "This event is not accessible");
          } else {
            setError("Failed to load event");
          }
          return;
        }
        const data = await response.json();
        setEvent(data);
      } catch {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    const isPrivate = error?.includes("private") || error?.includes("published");
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-gray-300 dark:text-gray-600 mb-6">
            {isPrivate ? Icons.lock : (
              <span className="text-7xl font-bold text-gray-200 dark:text-gray-700">404</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            {error || "Event not found"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isPrivate
              ? "This event is not publicly accessible. Contact the organizer for access."
              : "The event you're looking for doesn't exist or has been removed."}
          </p>
        </div>
      </div>
    );
  }

  const eventColor = event.color || "#3B82F6";
  const spotsLeft = event.max_attendees ? event.max_attendees - event.attendees_count : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  // Get event type config for proper field rendering
  const eventTypeConfig = getEventTypeConfig(event.event_type);
  const eventIcon = eventTypeIcons[event.event_type] || Icons.calendar;

  // Get public fields and organize them by tab
  const publicFields = getPublicFields(event.event_type);
  const fieldSections: FieldSection[] = [];

  if (eventTypeConfig?.tabs && event.requirements) {
    for (const tab of eventTypeConfig.tabs) {
      const tabFields = publicFields.filter(f => f.group === tab.id);
      const fieldsWithValues = tabFields
        .map(field => ({
          field,
          value: event.requirements?.[field.id],
        }))
        .filter(({ value }) => {
          if (value === null || value === undefined || value === "") return false;
          if (Array.isArray(value) && value.length === 0) return false;
          return true;
        });

      if (fieldsWithValues.length > 0) {
        fieldSections.push({
          title: tab.label,
          icon: tabIconMap[tab.id] || Icons.document,
          fields: fieldsWithValues,
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div
        className="relative h-72 md:h-80 lg:h-96"
        style={{ backgroundColor: eventColor }}
      >
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="text-white/10 transform scale-[8]">
              {eventIcon}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Event Type Badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-md text-white border border-white/10">
            <span className="w-4 h-4">{eventIcon}</span>
            {eventTypeConfig?.label || event.event_type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            event.status === "upcoming" ? "bg-blue-500/90 text-white" :
            event.status === "in_progress" ? "bg-green-500/90 text-white" :
            event.status === "completed" ? "bg-gray-500/90 text-white" :
            "bg-red-500/90 text-white"
          }`}>
            {event.status === "upcoming" && Icons.clock}
            {event.status === "in_progress" && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            {event.status === "completed" && Icons.check}
            {event.status === "cancelled" && Icons.x}
            {event.status === "upcoming" ? "Upcoming" :
             event.status === "in_progress" ? "Live Now" :
             event.status === "completed" ? "Completed" :
             "Cancelled"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-16">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          {/* Event Header */}
          <div className="p-6 md:p-8 lg:p-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {event.title}
            </h1>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {event.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Date & Time */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {Icons.calendar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(event.start_date)}
                  </p>
                  {event.start_time && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(event.start_time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                      {event.timezone && ` (${event.timezone})`}
                    </p>
                  )}
                  {event.end_date && event.end_date !== event.start_date && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Until {formatDate(event.end_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {event.is_virtual ? Icons.video : Icons.location}
                </div>
                <div>
                  {event.is_virtual ? (
                    <>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Virtual Event
                      </p>
                      {event.virtual_platform && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          via {event.virtual_platform.charAt(0).toUpperCase() + event.virtual_platform.slice(1).replace(/_/g, " ")}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {event.location || "Location TBA"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        In-person event
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Attendees */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {Icons.users}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {event.attendees_count} {event.attendees_count === 1 ? "Attendee" : "Attendees"}
                  </p>
                  {event.max_attendees && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {isFull ? "Event is full" : `${spotsLeft} spots remaining`}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {Icons.ticket}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {event.ticket_price ? `${event.currency || "$"}${event.ticket_price}` : "Free Event"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {event.registration_required ? "Registration required" : "No registration needed"}
                  </p>
                </div>
              </div>
            </div>

            {/* Register Button */}
            {event.status === "upcoming" && event.registration_required && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowRegistration(true)}
                  disabled={isFull}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-white text-lg transition-all flex items-center justify-center gap-3 ${
                    isFull
                      ? "bg-gray-400 cursor-not-allowed"
                      : "hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                  style={{ backgroundColor: isFull ? undefined : eventColor }}
                >
                  {isFull ? (
                    <>
                      {Icons.x}
                      Event is Full
                    </>
                  ) : (
                    <>
                      {Icons.ticket}
                      Register Now
                      {Icons.arrowRight}
                    </>
                  )}
                </button>
                <a
                  href={`/event/${event.slug}/portal`}
                  className="block w-full py-3 px-6 rounded-xl font-medium text-center transition-all border-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  style={{ borderColor: eventColor, color: eventColor }}
                >
                  Already registered? Access Portal
                </a>
              </div>
            )}

            {event.is_virtual && event.virtual_link && event.status === "in_progress" && (
              <a
                href={event.virtual_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 px-6 rounded-2xl font-semibold text-white text-lg text-center transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-3"
                style={{ backgroundColor: eventColor }}
              >
                <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                Join Live Event
                {Icons.arrowRight}
              </a>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="px-6 md:px-8 lg:px-10 pb-8">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {Icons.document}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  About This Event
                </h2>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* Type-Specific Sections */}
          {fieldSections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="px-6 md:px-8 lg:px-10 pb-8 pt-8 border-t border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-6">
                {section.fields.map(({ field, value }, fieldIndex) => (
                  <div key={fieldIndex}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                      {field.label}
                    </h3>
                    <FieldValue field={field} value={value} eventColor={eventColor} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Organizer */}
          {(event.organizer_name || event.contact_name || event.contact_email) && (
            <div className="px-6 md:px-8 lg:px-10 pb-8 pt-8 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  {Icons.user}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Organizer
                </h2>
              </div>
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                  style={{ backgroundColor: eventColor }}
                >
                  {(event.organizer_name || event.contact_name || "O").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    {event.organizer_name || event.contact_name || "Event Organizer"}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                    {event.contact_email && (
                      <a
                        href={`mailto:${event.contact_email}`}
                        className="text-sm hover:underline flex items-center gap-2"
                        style={{ color: eventColor }}
                      >
                        {Icons.mail}
                        {event.contact_email}
                      </a>
                    )}
                    {event.contact_phone && (
                      <a
                        href={`tel:${event.contact_phone}`}
                        className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"
                      >
                        {Icons.phone}
                        {event.contact_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-sm text-gray-400 dark:text-gray-500">
          Powered by OneToOne Events
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        eventId={event.slug}
        eventTitle={event.title}
        eventColor={eventColor}
        ticketPrice={event.ticket_price}
        currency={event.currency}
      />
    </div>
  );
}
