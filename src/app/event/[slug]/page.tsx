"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { getEventTypeConfig, getPublicFields } from "@/config/eventTypeSchema";
import type { FormField } from "@/config/eventTypeSchema";
import { AttendeeProvider, useAttendee } from "@/context/AttendeeContext";
import { getPortalTabsForEventType } from "@/config/portalTabConfig";
import { DashboardTab, TeamsTab, SubmissionsTab, ProfileTab, ScheduleTab, ChallengesTab, PrizesTab, InfoTab, PortalIcons } from "@/components/events/portal";
import type { Team, Attendee, Submission, TabType } from "@/components/events/portal/types";
import { DotPattern, GlowCard, ShimmerButton, ShineBorder, BorderBeam, GradientText } from "@/components/ui/magic";

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

interface FieldSection {
  title: string;
  icon: React.ReactNode;
  fields: { field: FormField; value: unknown }[];
}

// Icons
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
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ticket: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  globe: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  eye: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  eyeOff: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h14M5 3v4a7 7 0 007 7m-7-11H3v4a4 4 0 004 4m12-8v4a7 7 0 01-7 7m7-11h2v4a4 4 0 01-4 4m-5 3v4m-4 0h8" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
    </svg>
  ),
  lightbulb: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  mentor: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v7m-6-3.5V11" />
    </svg>
  ),
  scale: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  timer: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="13" r="8" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4l2 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 2h4M12 2v3" />
    </svg>
  ),
  gift: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  goldMedal: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="14" r="6" strokeWidth={1.5} fill="#FFD700" stroke="#DAA520" />
      <path d="M12 4v4" strokeWidth={2} stroke="#DAA520" />
      <path d="M8 2l4 6 4-6" strokeWidth={1.5} stroke="#DC143C" fill="#DC143C" />
      <text x="12" y="17" textAnchor="middle" fontSize="8" fill="#8B4513" fontWeight="bold">1</text>
    </svg>
  ),
  silverMedal: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="14" r="6" strokeWidth={1.5} fill="#C0C0C0" stroke="#A9A9A9" />
      <path d="M12 4v4" strokeWidth={2} stroke="#A9A9A9" />
      <path d="M8 2l4 6 4-6" strokeWidth={1.5} stroke="#4169E1" fill="#4169E1" />
      <text x="12" y="17" textAnchor="middle" fontSize="8" fill="#696969" fontWeight="bold">2</text>
    </svg>
  ),
  bronzeMedal: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="14" r="6" strokeWidth={1.5} fill="#CD7F32" stroke="#8B4513" />
      <path d="M12 4v4" strokeWidth={2} stroke="#8B4513" />
      <path d="M8 2l4 6 4-6" strokeWidth={1.5} stroke="#228B22" fill="#228B22" />
      <text x="12" y="17" textAnchor="middle" fontSize="8" fill="#5C4033" fontWeight="bold">3</text>
    </svg>
  ),
  medal: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="14" r="6" strokeWidth={1.5} stroke="currentColor" />
      <path d="M12 4v4" strokeWidth={2} stroke="currentColor" />
      <path d="M8 2l4 6 4-6" strokeWidth={1.5} stroke="currentColor" fill="none" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const tabIcons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  schedule: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  challenges: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  prizes: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  teams: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  submissions: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

// Helper function to format date safely
function formatDate(dateValue: unknown): string | null {
  if (!dateValue) return null;

  // Handle different date formats
  let date: Date;
  if (typeof dateValue === 'string') {
    // Try parsing as ISO string or date string
    date = new Date(dateValue);
  } else if (typeof dateValue === 'number') {
    date = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return null;
  }

  // Check if valid date
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Tech label mapping
const techLabels: Record<string, string> = {
  any: "Any Technology",
  web: "Web Development",
  mobile: "Mobile Apps",
  ai_ml: "AI/ML",
  blockchain: "Blockchain",
  iot: "IoT",
  cloud: "Cloud/DevOps",
  game: "Game Development",
};

// Team formation labels
const teamFormationLabels: Record<string, string> = {
  pre_formed: "Pre-formed Teams Only",
  on_site: "Form Teams On-site",
  both: "Both Options Available",
};

// Hackathon Details Component
interface HackathonDetailsProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  startDate?: string;
  endDate?: string;
}

function HackathonDetails({ requirements, eventColor, startDate, endDate }: HackathonDetailsProps) {
  // Team configuration
  const minSize = (requirements.team_size_min as number) || 1;
  const maxSize = (requirements.team_size_max as number) || 5;
  const isSolo = minSize === 1 && maxSize === 1;
  const allowSolo = requirements.allow_solo as boolean;
  const teamFormation = requirements.team_formation as string;
  const participantTracks = Array.isArray(requirements.participant_tracks) ? requirements.participant_tracks as string[] : [];

  // Challenges
  const problemStatements = Array.isArray(requirements.problem_statements)
    ? requirements.problem_statements as Array<{key: string; value: string}>
    : [];
  const themes = Array.isArray(requirements.themes) ? requirements.themes as string[] : [];
  const techRequirements = Array.isArray(requirements.tech_requirements) ? requirements.tech_requirements as string[] : [];
  const resourcesProvided = Array.isArray(requirements.resources_provided) ? requirements.resources_provided as string[] : [];

  // Prizes
  const prizes = Array.isArray(requirements.prizes) ? requirements.prizes as Array<{key: string; value: string}> : [];
  const specialAwards = Array.isArray(requirements.special_awards) ? requirements.special_awards as Array<{key: string; value: string}> : [];
  const judgingCriteria = Array.isArray(requirements.judging_criteria) ? requirements.judging_criteria as Array<{key: string; value: string}> : [];
  const judges = Array.isArray(requirements.judges) ? requirements.judges as Array<{name: string; title?: string; company?: string; avatar_url?: string}> : [];

  // Schedule
  const schedule = Array.isArray(requirements.schedule) ? requirements.schedule as Array<{key: string; value: string}> : [];
  const submissionDeadline = requirements.submission_deadline || requirements.submissionDeadline;
  const demoTimePerTeam = requirements.demo_time_per_team as number | undefined;
  const mentorshipAvailable = requirements.mentorship_available as boolean;

  // Booleans for conditional rendering
  const hasPrizes = prizes.length > 0;
  const hasThemes = themes.length > 0;
  const hasProblemStatements = problemStatements.length > 0;
  const hasSchedule = schedule.length > 0;
  const hasSpecialAwards = specialAwards.length > 0;
  const hasJudgingCriteria = judgingCriteria.length > 0;
  const hasJudges = judges.length > 0;
  const hasTechRequirements = techRequirements.length > 0;
  const hasParticipantTracks = participantTracks.length > 0;
  const hasResources = resourcesProvided.length > 0;
  const formattedDeadline = formatDate(submissionDeadline);

  return (
    <div className="space-y-6">
      {/* Quick Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Participation */}
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
            <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
              {isSolo ? Icons.user : Icons.users}
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {isSolo ? "Solo" : `${minSize}-${maxSize} Members`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Team Size</p>
          </div>

          {/* Prizes */}
          {hasPrizes ? (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {Icons.trophy}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {prizes.length} Prize{prizes.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">To Win</p>
            </div>
          ) : null}

          {/* Themes */}
          {hasThemes ? (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {Icons.target}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {themes.length} Theme{themes.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">To Explore</p>
            </div>
          ) : null}

          {/* Problem Statements */}
          {hasProblemStatements ? (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {Icons.lightbulb}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {problemStatements.length} Challenge{problemStatements.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">To Solve</p>
            </div>
          ) : null}

          {/* Mentorship */}
          {mentorshipAvailable ? (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {Icons.mentor}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Available</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Mentorship</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Problem Statements / Challenges */}
      {hasProblemStatements ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.lightbulb}</span> Problem Statements
          </h2>
          <div className="space-y-4">
            {problemStatements.map((ps, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-700"
                style={{ backgroundColor: `${eventColor}05` }}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: eventColor }}>
                    {i + 1}
                  </span>
                  {ps.key}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{ps.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Schedule */}
      {hasSchedule ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.calendar}</span> Event Schedule
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-4">
              {schedule.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium z-10 shrink-0"
                    style={{ backgroundColor: eventColor }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900 dark:text-white">{item.key}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Dates */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Important Dates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {startDate ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                    {Icons.calendar}
                  </div>
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Starts</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ) : null}
              {endDate ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    {Icons.calendar}
                  </div>
                  <div>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Ends</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className={`flex items-center gap-3 p-3 rounded-xl sm:col-span-2 ${formattedDeadline ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formattedDeadline ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                    {Icons.clock}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${formattedDeadline ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>Submission Deadline</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formattedDeadline || 'To be announced'}</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* If no schedule but has dates */}
      {!hasSchedule && (startDate || endDate) ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.clock}</span> Important Dates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {startDate ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                  {Icons.calendar}
                </div>
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Starts</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ) : null}
            {endDate ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  {Icons.calendar}
                </div>
                <div>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Ends</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ) : null}
            <div className={`flex items-center gap-3 p-3 rounded-xl sm:col-span-2 ${formattedDeadline ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formattedDeadline ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                {Icons.clock}
              </div>
              <div>
                <p className={`text-xs font-medium ${formattedDeadline ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>Submission Deadline</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formattedDeadline || 'To be announced'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Prizes & Awards */}
      {hasPrizes || hasSpecialAwards ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.trophy}</span> Prizes & Awards
          </h2>

          {/* Main Prizes */}
          {hasPrizes ? (
            <div className="space-y-2 mb-4">
              {prizes.map((prize, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: i === 0 ? `${eventColor}15` : `${eventColor}08` }}
                >
                  <span className="font-medium text-gray-900 dark:text-white flex items-center gap-3">
                    <span>
                      {i === 0 ? Icons.goldMedal : i === 1 ? Icons.silverMedal : i === 2 ? Icons.bronzeMedal : Icons.medal}
                    </span>
                    {prize.key}
                  </span>
                  <span className="font-bold text-lg" style={{ color: eventColor }}>{prize.value}</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Special Awards */}
          {hasSpecialAwards ? (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Special Awards</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {specialAwards.map((award, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20"
                  >
                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-purple-500">{Icons.star}</span> {award.key}
                    </span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{award.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Judging */}
      {hasJudgingCriteria || hasJudges ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.scale}</span> Judging
          </h2>

          {/* Judging Criteria */}
          {hasJudgingCriteria ? (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Scoring Criteria</h3>
              <div className="space-y-2">
                {judgingCriteria.map((criteria, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{criteria.key}</span>
                        <span className="text-sm font-bold" style={{ color: eventColor }}>{criteria.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            backgroundColor: eventColor,
                            width: criteria.value.replace('%', '') + '%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Judges */}
          {hasJudges ? (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Meet the Judges</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {judges.map((judge, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                      style={{ backgroundColor: eventColor }}
                    >
                      {judge.avatar_url ? (
                        <img src={judge.avatar_url} alt={judge.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        judge.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{judge.name}</p>
                      {(judge.title || judge.company) ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {judge.title}{judge.title && judge.company ? ' at ' : ''}{judge.company}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Demo Time */}
          {demoTimePerTeam ? (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span style={{ color: eventColor }}>{Icons.timer}</span>
                <span>Each team gets <strong className="text-gray-900 dark:text-white">{demoTimePerTeam} minutes</strong> to present their project</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Themes & Technologies */}
      {hasThemes || hasTechRequirements ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.target}</span> Themes & Technologies
          </h2>

          {/* Themes */}
          {hasThemes ? (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Hackathon Themes</h3>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Allowed Technologies */}
          {hasTechRequirements ? (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Allowed Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {techRequirements.map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    {techLabels[tech] || tech}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Team & Participation Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl" style={{ color: eventColor }}>{Icons.users}</span> Participation Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team Size */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Team Size</h3>
            <p className="font-semibold text-gray-900 dark:text-white">
              {isSolo ? "Solo Participation Only" : `${minSize} - ${maxSize} members per team`}
            </p>
            {!isSolo && allowSolo ? (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Solo participants also welcome</p>
            ) : null}
          </div>

          {/* Team Formation */}
          {teamFormation && !isSolo ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Team Formation</h3>
              <p className="font-semibold text-gray-900 dark:text-white">
                {teamFormationLabels[teamFormation] || teamFormation}
              </p>
            </div>
          ) : null}

          {/* Participant Categories */}
          {hasParticipantTracks ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Participant Categories</h3>
              <div className="flex flex-wrap gap-2">
                {participantTracks.map((track, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {track}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Resources Provided */}
      {hasResources ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>{Icons.gift}</span> Resources Provided
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resourcesProvided.map((resource, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <span className="text-green-500">{Icons.checkCircle}</span>
                <span className="text-gray-700 dark:text-gray-300">{resource}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Workshop Details Component
interface WorkshopDetailsProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  startDate?: string;
  endDate?: string;
}

function WorkshopDetails({ requirements, eventColor }: WorkshopDetailsProps) {
  // Workshop content
  const learningObjectives = Array.isArray(requirements.learning_objectives) ? requirements.learning_objectives as string[] : [];
  const topicsCovered = Array.isArray(requirements.topics_covered) ? requirements.topics_covered as string[] : [];
  const skillLevel = requirements.skill_level as string;
  const workshopFormat = requirements.workshop_format as string;
  const agenda = Array.isArray(requirements.agenda) ? requirements.agenda as Array<{key: string; value: string}> : [];

  // Requirements
  const prerequisites = Array.isArray(requirements.prerequisites) ? requirements.prerequisites as string[] : [];
  const materialsNeeded = Array.isArray(requirements.materials_needed) ? requirements.materials_needed as string[] : [];
  const softwareRequirements = Array.isArray(requirements.software_requirements) ? requirements.software_requirements as string[] : [];
  const materialsProvided = Array.isArray(requirements.materials_provided) ? requirements.materials_provided as string[] : [];
  const hasCertification = requirements.certification as boolean;

  // Instructor
  const instructorName = requirements.instructor_name as string;
  const instructorTitle = requirements.instructor_title as string;
  const instructorBio = requirements.instructor_bio as string;
  const instructorLinkedin = requirements.instructor_linkedin as string;

  // Skill level labels and colors
  const skillLevelConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    beginner: { label: "Beginner", color: "#22c55e", bgColor: "#22c55e15" },
    intermediate: { label: "Intermediate", color: "#f59e0b", bgColor: "#f59e0b15" },
    advanced: { label: "Advanced", color: "#ef4444", bgColor: "#ef444415" },
    all: { label: "All Levels", color: "#6b7280", bgColor: "#6b728015" },
  };

  // Format labels
  const formatLabels: Record<string, string> = {
    lecture: "Lecture & Presentation",
    hands_on: "Hands-on Lab",
    mixed: "Mixed (Lecture + Exercises)",
    project: "Build a Project",
  };

  const hasLearningObjectives = learningObjectives.length > 0;
  const hasTopics = topicsCovered.length > 0;
  const hasAgenda = agenda.length > 0;
  const hasPrerequisites = prerequisites.length > 0;
  const hasMaterialsNeeded = materialsNeeded.length > 0;
  const hasSoftwareRequirements = softwareRequirements.length > 0;
  const hasMaterialsProvided = materialsProvided.length > 0;
  const hasInstructor = instructorName || instructorTitle || instructorBio;

  return (
    <div className="space-y-6">
      {/* Quick Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workshop Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Skill Level */}
          {skillLevel && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: skillLevelConfig[skillLevel]?.bgColor || `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${skillLevelConfig[skillLevel]?.color || eventColor}20`, color: skillLevelConfig[skillLevel]?.color || eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{skillLevelConfig[skillLevel]?.label || skillLevel}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Skill Level</p>
            </div>
          )}

          {/* Format */}
          {workshopFormat && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatLabels[workshopFormat] || workshopFormat}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Format</p>
            </div>
          )}

          {/* Topics Count */}
          {hasTopics && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{topicsCovered.length} Topics</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">To Cover</p>
            </div>
          )}

          {/* Certification */}
          {hasCertification && (
            <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Certificate</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Provided</p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Objectives */}
      {hasLearningObjectives && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            What You&apos;ll Learn
          </h2>
          <div className="grid gap-3">
            {learningObjectives.map((objective, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <span className="mt-0.5 text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">{objective}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics Covered */}
      {hasTopics && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            Topics Covered
          </h2>
          <div className="flex flex-wrap gap-2">
            {topicsCovered.map((topic, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Workshop Agenda */}
      {hasAgenda && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>{Icons.calendar}</span>
            Workshop Schedule
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-4">
              {agenda.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium z-10 shrink-0"
                    style={{ backgroundColor: eventColor }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900 dark:text-white">{item.key}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Requirements Section */}
      {(hasPrerequisites || hasMaterialsNeeded || hasSoftwareRequirements || hasMaterialsProvided) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            Requirements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prerequisites */}
            {hasPrerequisites && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Prerequisites</h3>
                <ul className="space-y-2">
                  {prerequisites.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eventColor }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Materials to Bring */}
            {hasMaterialsNeeded && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">What to Bring</h3>
                <ul className="space-y-2">
                  {materialsNeeded.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-orange-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Software Requirements */}
            {hasSoftwareRequirements && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Software to Install</h3>
                <ul className="space-y-2">
                  {softwareRequirements.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Materials Provided */}
            {hasMaterialsProvided && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">What We Provide</h3>
                <ul className="space-y-2">
                  {materialsProvided.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-green-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructor Section */}
      {hasInstructor && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            Your Instructor
          </h2>
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ backgroundColor: eventColor }}
            >
              {instructorName?.charAt(0).toUpperCase() || "I"}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{instructorName}</h3>
              {instructorTitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{instructorTitle}</p>
              )}
              {instructorBio && (
                <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{instructorBio}</p>
              )}
              {instructorLinkedin && (
                <a
                  href={instructorLinkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm font-medium"
                  style={{ color: eventColor }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  View LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Meetup Details Component
interface MeetupDetailsProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  startDate?: string;
  endDate?: string;
}

function MeetupDetails({ requirements, eventColor }: MeetupDetailsProps) {
  // Meetup content
  const meetupType = requirements.meetup_type as string;
  const community = requirements.community as string;
  const topics = Array.isArray(requirements.topics) ? requirements.topics as string[] : [];
  const agenda = Array.isArray(requirements.agenda) ? requirements.agenda as Array<{key: string; value: string}> : [];

  // Speakers
  const speakers = Array.isArray(requirements.speakers) ? requirements.speakers as Array<{name: string; title?: string; company?: string; avatar_url?: string}> : [];
  const talkDuration = requirements.talk_duration as number;
  const hasQASession = requirements.qa_session as boolean;

  // Perks
  const refreshments = requirements.refreshments as string;
  const networkingActivities = Array.isArray(requirements.networking_activities) ? requirements.networking_activities as string[] : [];
  const swag = Array.isArray(requirements.swag) ? requirements.swag as string[] : [];
  const hasSponsorBooths = requirements.sponsor_booths as boolean;

  // Meetup type labels
  const meetupTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    tech_talk: {
      label: "Tech Talk",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    panel: {
      label: "Panel Discussion",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    networking: {
      label: "Networking Event",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    workshop: {
      label: "Mini Workshop",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    demo: {
      label: "Show & Tell",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    social: {
      label: "Social Gathering",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  };

  // Refreshments labels
  const refreshmentsConfig: Record<string, { label: string; icon: string }> = {
    none: { label: "Not Provided", icon: "❌" },
    drinks: { label: "Drinks Only", icon: "☕" },
    light: { label: "Light Snacks", icon: "🍕" },
    full: { label: "Full Catering", icon: "🍽️" },
  };

  const hasTopics = topics.length > 0;
  const hasAgenda = agenda.length > 0;
  const hasSpeakers = speakers.length > 0;
  const hasNetworkingActivities = networkingActivities.length > 0;
  const hasSwag = swag.length > 0;

  return (
    <div className="space-y-6">
      {/* Quick Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meetup Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Meetup Type */}
          {meetupType && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {meetupTypeConfig[meetupType]?.icon || (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{meetupTypeConfig[meetupType]?.label || meetupType}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Format</p>
            </div>
          )}

          {/* Speakers Count */}
          {hasSpeakers && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{speakers.length} Speaker{speakers.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Presenting</p>
            </div>
          )}

          {/* Talk Duration */}
          {talkDuration && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {Icons.clock}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{talkDuration} min</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Per Talk</p>
            </div>
          )}

          {/* Q&A Session */}
          {hasQASession && (
            <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Q&A</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Session</p>
            </div>
          )}

          {/* Refreshments */}
          {refreshments && refreshments !== 'none' && (
            <div className="text-center p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-lg">
                {refreshmentsConfig[refreshments]?.icon || "🍴"}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{refreshmentsConfig[refreshments]?.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Food & Drinks</p>
            </div>
          )}
        </div>
      </div>

      {/* Community */}
      {community && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: eventColor }}
            >
              {community.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hosted by</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{community}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Discussion Topics */}
      {hasTopics && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </span>
            Discussion Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Event Schedule */}
      {hasAgenda && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>{Icons.calendar}</span>
            Event Schedule
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-4">
              {agenda.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium z-10 shrink-0"
                    style={{ backgroundColor: eventColor }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900 dark:text-white">{item.key}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Speakers */}
      {hasSpeakers && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </span>
            Speakers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {speakers.map((speaker, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0"
                  style={{ backgroundColor: eventColor }}
                >
                  {speaker.avatar_url ? (
                    <img src={speaker.avatar_url} alt={speaker.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    speaker.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{speaker.name}</p>
                  {(speaker.title || speaker.company) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {speaker.title}{speaker.title && speaker.company ? ' at ' : ''}{speaker.company}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perks Section */}
      {(hasNetworkingActivities || hasSwag || hasSponsorBooths) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </span>
            Perks & Goodies
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Networking Activities */}
            {hasNetworkingActivities && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Networking Activities</h3>
                <ul className="space-y-2">
                  {networkingActivities.map((activity, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-green-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Swag */}
            {hasSwag && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Swag & Giveaways</h3>
                <div className="flex flex-wrap gap-2">
                  {swag.map((item, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                    >
                      🎁 {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sponsor Booths */}
          {hasSponsorBooths && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span style={{ color: eventColor }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <span><strong className="text-gray-900 dark:text-white">Sponsor Booths</strong> will be available for networking</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// General Event Details Component
interface GeneralEventDetailsProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  startDate?: string;
  endDate?: string;
}

function GeneralEventDetails({ requirements, eventColor }: GeneralEventDetailsProps) {
  // General event content
  const highlights = Array.isArray(requirements.highlights) ? requirements.highlights as string[] : [];
  const agenda = Array.isArray(requirements.agenda) ? requirements.agenda as Array<{key: string; value: string}> : [];
  const whatToBring = Array.isArray(requirements.what_to_bring) ? requirements.what_to_bring as string[] : [];
  const dressCode = requirements.dress_code as string;

  // Dress code labels and icons
  const dressCodeConfig: Record<string, { label: string; icon: string; description: string }> = {
    casual: { label: "Casual", icon: "👕", description: "Comfortable, everyday attire" },
    smart_casual: { label: "Smart Casual", icon: "👔", description: "Neat but relaxed" },
    business: { label: "Business", icon: "💼", description: "Professional attire" },
    formal: { label: "Formal", icon: "🎩", description: "Formal dress code" },
  };

  const hasHighlights = highlights.length > 0;
  const hasAgenda = agenda.length > 0;
  const hasWhatToBring = whatToBring.length > 0;

  return (
    <div className="space-y-6">
      {/* Quick Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Highlights Count */}
          {hasHighlights && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{highlights.length} Highlights</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Key Features</p>
            </div>
          )}

          {/* Schedule Items */}
          {hasAgenda && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {Icons.calendar}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{agenda.length} Sessions</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled</p>
            </div>
          )}

          {/* Items to Bring */}
          {hasWhatToBring && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{whatToBring.length} Items</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">To Bring</p>
            </div>
          )}

          {/* Dress Code */}
          {dressCode && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 text-xl" style={{ backgroundColor: `${eventColor}15` }}>
                {dressCodeConfig[dressCode]?.icon || "👔"}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{dressCodeConfig[dressCode]?.label || dressCode}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dress Code</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Highlights */}
      {hasHighlights && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </span>
            Event Highlights
          </h2>
          <div className="grid gap-3">
            {highlights.map((highlight, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: eventColor }}
                >
                  {i + 1}
                </div>
                <span className="text-gray-700 dark:text-gray-300 pt-1">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What to Bring & Dress Code */}
      {(hasWhatToBring || dressCode) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            What to Know
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What to Bring */}
            {hasWhatToBring && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">What to Bring</h3>
                <ul className="space-y-2">
                  {whatToBring.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                      <span className="text-orange-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dress Code Details */}
            {dressCode && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Dress Code</h3>
                <div className="p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{dressCodeConfig[dressCode]?.icon || "👔"}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{dressCodeConfig[dressCode]?.label || dressCode}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{dressCodeConfig[dressCode]?.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Game Jam Details Component
interface GameJamDetailsProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  startDate?: string;
  endDate?: string;
}

function GameJamDetails({ requirements, eventColor, startDate, endDate }: GameJamDetailsProps) {
  // Theme & Rules
  const jamTheme = requirements.jam_theme as string;
  const themeReveal = requirements.theme_reveal as string;
  const jamDuration = requirements.jam_duration as number;
  const rules = Array.isArray(requirements.rules) ? requirements.rules as string[] : [];
  const diversifiers = Array.isArray(requirements.diversifiers) ? requirements.diversifiers as string[] : [];

  // Technical Requirements
  const allowedEngines = Array.isArray(requirements.allowed_engines) ? requirements.allowed_engines as string[] : [];
  const platforms = Array.isArray(requirements.platforms) ? requirements.platforms as string[] : [];
  const teamSize = requirements.team_size as number;
  const submissionPlatform = requirements.submission_platform as string;
  const assetRules = requirements.asset_rules as string;

  // Prizes - handle both number and object format { amount, currency }
  const prizePoolRaw = requirements.prize_pool;
  const prizePool = typeof prizePoolRaw === 'object' && prizePoolRaw !== null
    ? (prizePoolRaw as { amount?: number; currency?: string })
    : typeof prizePoolRaw === 'number'
    ? { amount: prizePoolRaw, currency: 'USD' }
    : null;
  const prizes = Array.isArray(requirements.prizes) ? requirements.prizes as Array<{key: string; value: string}> : [];
  const judgingCategories = Array.isArray(requirements.judging_categories) ? requirements.judging_categories as Array<{key: string; value: string}> : [];
  const communityVoting = requirements.community_voting as boolean;
  const votingPeriod = requirements.voting_period as number;

  // Engine labels with icons
  const engineConfig: Record<string, { label: string; icon: string }> = {
    any: { label: "Any Engine", icon: "🎮" },
    unity: { label: "Unity", icon: "🔷" },
    unreal: { label: "Unreal Engine", icon: "⬛" },
    godot: { label: "Godot", icon: "🤖" },
    gamemaker: { label: "GameMaker", icon: "🎯" },
    construct: { label: "Construct", icon: "🔧" },
    custom: { label: "Custom/From Scratch", icon: "💻" },
  };

  // Platform labels
  const platformConfig: Record<string, { label: string; icon: string }> = {
    web: { label: "Web Browser", icon: "🌐" },
    windows: { label: "Windows", icon: "💻" },
    mac: { label: "macOS", icon: "🍎" },
    linux: { label: "Linux", icon: "🐧" },
    mobile: { label: "Mobile", icon: "📱" },
  };

  // Submission platform labels
  const submissionPlatformConfig: Record<string, { label: string; url?: string }> = {
    itch: { label: "itch.io", url: "https://itch.io" },
    gamejolt: { label: "Game Jolt", url: "https://gamejolt.com" },
    custom: { label: "Custom Submission Form" },
  };

  // Asset rules config
  const assetRulesConfig: Record<string, { label: string; icon: string; description: string }> = {
    original: { label: "Original Assets Only", icon: "🎨", description: "All art, audio, and assets must be created during the jam" },
    licensed: { label: "Licensed Assets OK", icon: "📜", description: "You may use properly licensed assets from asset stores" },
    any: { label: "Any Assets Allowed", icon: "✅", description: "No restrictions on asset usage" },
  };

  // Helper function to format date
  const formatDateTime = (dateValue: unknown): string | null => {
    if (!dateValue) return null;
    const date = new Date(dateValue as string);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const hasRules = rules.length > 0;
  const hasDiversifiers = diversifiers.length > 0;
  const hasEngines = allowedEngines.length > 0;
  const hasPlatforms = platforms.length > 0;
  const hasPrizes = prizes.length > 0;
  const hasJudgingCategories = judgingCategories.length > 0;
  const formattedThemeReveal = formatDateTime(themeReveal);

  return (
    <div className="space-y-6">
      {/* Quick Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Game Jam Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Duration */}
          {jamDuration && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{jamDuration} Hours</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
            </div>
          )}

          {/* Team Size */}
          {teamSize && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {Icons.users}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Max {teamSize}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Team Size</p>
            </div>
          )}

          {/* Prizes */}
          {hasPrizes && (
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${eventColor}08` }}>
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                {Icons.trophy}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{prizes.length} Prize{prizes.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">To Win</p>
            </div>
          )}

          {/* Community Voting */}
          {communityVoting && (
            <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Public Vote</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{votingPeriod ? `${votingPeriod} Days` : 'Enabled'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Theme Section */}
      {(jamTheme || formattedThemeReveal) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            Jam Theme
          </h2>

          {jamTheme ? (
            <div className="p-6 rounded-xl text-center" style={{ backgroundColor: `${eventColor}10` }}>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">"{jamTheme}"</p>
              {formattedThemeReveal && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Theme revealed: {formattedThemeReveal}
                </p>
              )}
            </div>
          ) : formattedThemeReveal ? (
            <div className="p-6 rounded-xl text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30">
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Theme To Be Announced</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">{formattedThemeReveal}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Rules */}
      {hasRules && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            Jam Rules
          </h2>
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: eventColor }}
                >
                  {i + 1}
                </div>
                <span className="text-gray-700 dark:text-gray-300">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Challenges / Diversifiers */}
      {hasDiversifiers && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>{Icons.star}</span>
            Bonus Challenges
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Complete these optional challenges for extra recognition!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {diversifiers.map((challenge, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30">
                <span className="text-yellow-500 text-lg">⭐</span>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{challenge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Requirements */}
      {(hasEngines || hasPlatforms || assetRules || submissionPlatform) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Technical Requirements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allowed Engines */}
            {hasEngines && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Allowed Game Engines</h3>
                <div className="flex flex-wrap gap-2">
                  {allowedEngines.map((engine, i) => (
                    <span
                      key={i}
                      className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                      style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                    >
                      <span>{engineConfig[engine]?.icon || "🎮"}</span>
                      {engineConfig[engine]?.label || engine}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Target Platforms */}
            {hasPlatforms && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Target Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform, i) => (
                    <span
                      key={i}
                      className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    >
                      <span>{platformConfig[platform]?.icon || "💻"}</span>
                      {platformConfig[platform]?.label || platform}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Asset Rules */}
            {assetRules && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Asset Rules</h3>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{assetRulesConfig[assetRules]?.icon || "📦"}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{assetRulesConfig[assetRules]?.label || assetRules}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{assetRulesConfig[assetRules]?.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submission Platform */}
            {submissionPlatform && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Submit Your Game</h3>
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{submissionPlatformConfig[submissionPlatform]?.label || submissionPlatform}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Submission platform</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prizes */}
      {(hasPrizes || (prizePool && prizePool.amount)) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>{Icons.trophy}</span>
            Prizes
          </h2>

          {/* Prize Pool */}
          {prizePool && prizePool.amount && (
            <div className="mb-6 p-6 rounded-xl text-center" style={{ backgroundColor: `${eventColor}10` }}>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Prize Pool</p>
              <p className="text-3xl font-bold" style={{ color: eventColor }}>
                {prizePool.currency === 'USD' ? '$' : prizePool.currency + ' '}{prizePool.amount.toLocaleString()}
              </p>
            </div>
          )}

          {/* Prize Breakdown */}
          {hasPrizes && (
            <div className="space-y-2">
              {prizes.map((prize, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: i === 0 ? `${eventColor}15` : `${eventColor}08` }}
                >
                  <span className="font-medium text-gray-900 dark:text-white flex items-center gap-3">
                    <span>
                      {i === 0 ? Icons.goldMedal : i === 1 ? Icons.silverMedal : i === 2 ? Icons.bronzeMedal : Icons.medal}
                    </span>
                    {prize.key}
                  </span>
                  <span className="font-bold text-lg" style={{ color: eventColor }}>{prize.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Judging Categories */}
      {hasJudgingCategories && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span style={{ color: eventColor }}>{Icons.scale}</span>
            Judging Criteria
          </h2>
          <div className="space-y-3">
            {judgingCategories.map((criteria, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{criteria.key}</span>
                    <span className="text-sm font-bold" style={{ color: eventColor }}>{criteria.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: eventColor,
                        width: criteria.value.replace('%', '') + '%'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Community Voting Info */}
          {communityVoting && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Community Voting Enabled</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    The public can vote on games{votingPeriod ? ` for ${votingPeriod} days after submission` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventPageContent() {
  const params = useParams();
  const slug = params.slug as string;
  const { attendee, team, teamRole, token, isLoading: authLoading, isAuthenticated, logout, refreshSession, event: attendeeEvent } = useAttendee();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Registration wizard state
  const [regStep, setRegStep] = useState<"details" | "otp" | "phone">("details");
  const [regOtp, setRegOtp] = useState(["", "", "", "", "", ""]);
  const [regPhone, setRegPhone] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("+971");
  const [regPhoneError, setRegPhoneError] = useState<string | null>(null);
  const [regPhoneTouched, setRegPhoneTouched] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Portal state
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [publicActiveTab, setPublicActiveTab] = useState<"overview" | "schedule" | "challenges" | "prizes" | "info">("overview");
  const [teams, setTeams] = useState<Team[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [problemStatements, setProblemStatements] = useState<{ id: string; title: string; description?: string; category?: string }[]>([]);

  // Fetch event data
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

  // Get tabs config (pass requirements to filter out teams tab for solo events)
  const tabs = event ? getPortalTabsForEventType(event.event_type, event.requirements as Record<string, unknown>) : [];
  const hasTeams = tabs.some(t => t.id === "teams");
  const hasSubmissions = tabs.some(t => t.id === "submissions");

  // Fetch portal data
  const fetchTeams = async () => {
    if (!slug || !hasTeams) return;
    try {
      const res = await fetch(`/api/events/public/${slug}/teams`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchAttendees = async () => {
    if (!slug || !hasTeams) return;
    try {
      const res = await fetch(`/api/events/public/${slug}/attendees?looking_for_team=true`);
      const data = await res.json();
      setAttendees(data.attendees || []);
    } catch (error) {
      console.error("Error fetching attendees:", error);
    }
  };

  const fetchSubmissions = async () => {
    if (!slug || !token || !hasSubmissions) return;
    try {
      const res = await fetch(`/api/events/public/${slug}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data.submissions || []);
      const own = data.submissions?.find((s: Submission) =>
        (s.attendee?.id === attendee?.id) || (s.team?.id === team?.id)
      );
      setMySubmission(own || null);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const fetchProblemStatements = async () => {
    if (!slug || !hasSubmissions) return;
    try {
      const res = await fetch(`/api/events/public/${slug}/problem-statements`);
      const data = await res.json();
      setProblemStatements(data.problemStatements || []);
    } catch (error) {
      console.error("Error fetching problem statements:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && event) {
      fetchTeams();
      fetchAttendees();
      fetchSubmissions();
      fetchProblemStatements();
    }
  }, [isAuthenticated, event]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  // Phone validation
  const REG_PHONE_MIN: Record<string, number> = {
    "+971": 9, "+1": 10, "+44": 10, "+91": 10, "+966": 9,
    "+974": 8, "+973": 8, "+968": 8, "+965": 8, "+962": 9,
    "+961": 7, "+20": 10, "+49": 10, "+33": 9, "+61": 9,
  };
  const REG_COUNTRY_CODES = [
    { code: "+971", flag: "🇦🇪", name: "UAE" },
    { code: "+1", flag: "🇺🇸", name: "US" },
    { code: "+44", flag: "🇬🇧", name: "UK" },
    { code: "+91", flag: "🇮🇳", name: "India" },
    { code: "+966", flag: "🇸🇦", name: "Saudi" },
    { code: "+974", flag: "🇶🇦", name: "Qatar" },
    { code: "+973", flag: "🇧🇭", name: "Bahrain" },
    { code: "+968", flag: "🇴🇲", name: "Oman" },
    { code: "+965", flag: "🇰🇼", name: "Kuwait" },
    { code: "+962", flag: "🇯🇴", name: "Jordan" },
    { code: "+961", flag: "🇱🇧", name: "Lebanon" },
    { code: "+20", flag: "🇪🇬", name: "Egypt" },
    { code: "+49", flag: "🇩🇪", name: "Germany" },
    { code: "+33", flag: "🇫🇷", name: "France" },
    { code: "+61", flag: "🇦🇺", name: "Australia" },
  ];

  useEffect(() => {
    if (!regPhoneTouched) return;
    const digits = regPhone.replace(/\D/g, "");
    const min = REG_PHONE_MIN[regCountryCode] ?? 7;
    if (!digits) setRegPhoneError("Phone number is required");
    else if (digits.length < min) setRegPhoneError(`Enter at least ${min} digits`);
    else if (digits.length > 15) setRegPhoneError("Phone number is too long");
    else setRegPhoneError(null);
  }, [regPhone, regCountryCode, regPhoneTouched]);

  // Handle login (unchanged path)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);

    try {
      const res = await fetch(`/api/events/public/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      if (data.token) {
        localStorage.setItem(`attendee_token_${slug}`, data.token);
        refreshSession();
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Registration wizard — Step 1: send OTP
  const handleRegSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim() || !authEmail.trim() || authPassword.length < 6) return;
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setRegStep("otp");
      setOtpCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Registration wizard — Step 2: verify OTP
  const handleRegVerifyOTP = useCallback(async (code?: string) => {
    const otp = code ?? regOtp.join("");
    if (otp.length !== 6) return;
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setRegStep("phone");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong");
      setRegOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setAuthSubmitting(false);
    }
  }, [authEmail, regOtp]);

  const handleRegOtpChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...regOtp];
    next[i] = d;
    setRegOtp(next);
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
    if (d && i === 5 && next.join("").length === 6) handleRegVerifyOTP(next.join(""));
  };

  const handleRegOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !regOtp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleRegOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let j = 0; j < pasted.length; j++) next[j] = pasted[j];
    setRegOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) handleRegVerifyOTP(pasted);
  };

  const handleRegResendOTP = async () => {
    if (otpCooldown > 0) return;
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend code");
      setOtpCooldown(60);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Registration wizard — Step 3: submit with phone
  const handleRegComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegPhoneTouched(true);
    const digits = regPhone.replace(/\D/g, "");
    const min = REG_PHONE_MIN[regCountryCode] ?? 7;
    if (!digits || digits.length < min) {
      setRegPhoneError(digits ? `Enter at least ${min} digits` : "Phone number is required");
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const phone = `${regCountryCode}${digits}`;
      const res = await fetch(`/api/events/public/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email: authEmail, password: authPassword, name: authName, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      if (data.token) {
        localStorage.setItem(`attendee_token_${slug}`, data.token);
        refreshSession();
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Legacy handler for login mode only
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "login") {
      handleLogin(e);
    } else {
      handleRegSendOTP(e);
    }
  };

  const handleRefreshAll = () => {
    fetchTeams();
    fetchAttendees();
    refreshSession();
  };

  // Loading
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

  // Error
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <span className="text-7xl font-bold text-gray-200 dark:text-gray-700">404</span>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 mt-4">
            {error || "Event not found"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            The event you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const eventColor = event.color || "#6366F1";
  const eventTypeConfig = getEventTypeConfig(event.event_type);
  const eventTypeLabel = eventTypeConfig?.label || event.event_type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());

  // Format helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const spotsLeft = event.max_attendees ? event.max_attendees - event.attendees_count : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  const requirements = event.requirements || {};
  const minTeamSize = (requirements.team_size_min as number) || 1;
  const needsTeam = minTeamSize > 1 && !team;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Modern Hero Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${eventColor} 0%, ${eventColor}cc 50%, ${eventColor}99 100%)`
        }}
      >
        {/* Dot Pattern Background */}
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className="opacity-30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"
        />

        {event.cover_image && (
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url(${event.cover_image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-4">
              {/* Status Badges */}
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/25 text-white backdrop-blur-md border border-white/20 shadow-lg">
                  {eventTypeLabel}
                </span>
                {event.status === "upcoming" && (
                  <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-sm shadow-lg shadow-emerald-500/25">
                    Upcoming
                  </span>
                )}
                {event.status === "in_progress" && (
                  <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-red-500/90 text-white flex items-center gap-2 shadow-lg shadow-red-500/25">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Live Now
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-md">
                {event.title}
              </h1>

              {/* Date and Time */}
              <div className="flex flex-wrap items-center gap-4 text-white/95">
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  {Icons.calendar}
                  <span className="font-medium">{formatDate(event.start_date)}</span>
                </span>
                {event.start_time && (
                  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    {Icons.clock}
                    <span className="font-medium">{formatTime(event.start_time)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* User info if logged in */}
            {isAuthenticated && attendee && (
              <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 shadow-xl">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner"
                  style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                >
                  {attendee.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-white font-semibold">{attendee.name}</p>
                  <p className="text-white/70 text-sm">Registered Participant</p>
                </div>
                <button
                  onClick={logout}
                  className="ml-3 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200"
                  title="Logout"
                >
                  {Icons.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated ? (
          /* LOGGED IN VIEW - Modern Portal Layout */
          <div className="space-y-6">
            {/* Welcome Banner with Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* User Welcome */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                      style={{ backgroundColor: eventColor }}
                    >
                      {attendee?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{attendee?.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{attendee?.email}</p>
                    </div>
                  </div>

                  {/* Quick Status Cards */}
                  <div className="flex flex-wrap gap-3">
                    {/* Registration Status */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Registered</span>
                    </div>

                    {/* Team Status - for hackathons */}
                    {hasTeams && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                        team
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${team ? "bg-blue-500" : "bg-orange-500"}`} />
                        <span className={`text-sm font-medium ${
                          team
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-orange-700 dark:text-orange-400"
                        }`}>
                          {team ? team.name : "No Team"}
                        </span>
                      </div>
                    )}

                    {/* Submission Status - for hackathons */}
                    {hasSubmissions && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                        mySubmission
                          ? mySubmission.status === "submitted"
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                          : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          mySubmission
                            ? mySubmission.status === "submitted" ? "bg-green-500" : "bg-yellow-500"
                            : "bg-gray-400"
                        }`} />
                        <span className={`text-sm font-medium ${
                          mySubmission
                            ? mySubmission.status === "submitted"
                              ? "text-green-700 dark:text-green-400"
                              : "text-yellow-700 dark:text-yellow-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {mySubmission ? (mySubmission.status === "submitted" ? "Submitted" : "Draft") : "No Submission"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative ${
                        activeTab === tab.id
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <span className={`transition-colors ${activeTab === tab.id ? "" : ""}`} style={activeTab === tab.id ? { color: eventColor } : undefined}>
                        {tabIcons[tab.id]}
                      </span>
                      <span className="hidden sm:inline">{tab.label}</span>
                      {activeTab === tab.id && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                          style={{ backgroundColor: eventColor }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tab Content - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <GlowCard glowColor={`${eventColor}25`} className="p-6">
                  {activeTab === "dashboard" && (
                    <DashboardTab
                      attendee={attendee!}
                      team={team}
                      teamRole={teamRole}
                      mySubmission={mySubmission}
                      needsTeam={needsTeam}
                      eventColor={eventColor}
                      eventSlug={slug}
                      requirements={requirements}
                      onNavigate={setActiveTab}
                      eventType={event.event_type}
                    />
                  )}
                  {activeTab === "teams" && hasTeams && (
                    <TeamsTab
                      teams={teams}
                      attendees={attendees}
                      team={team}
                      attendee={attendee!}
                      token={token!}
                      eventSlug={slug}
                      eventColor={eventColor}
                      requirements={requirements}
                      onRefresh={handleRefreshAll}
                    />
                  )}
                  {activeTab === "submissions" && hasSubmissions && (
                    <SubmissionsTab
                      submissions={submissions}
                      mySubmission={mySubmission}
                      team={team}
                      attendee={attendee!}
                      token={token!}
                      eventSlug={slug}
                      eventColor={eventColor}
                      requirements={requirements}
                      problemStatements={problemStatements}
                      onRefresh={fetchSubmissions}
                    />
                  )}
                  {activeTab === "profile" && (
                    <ProfileTab
                      attendee={attendee!}
                      eventColor={eventColor}
                      requirements={event?.requirements as Record<string, unknown>}
                      eventType={event.event_type}
                    />
                  )}
                  {activeTab === "schedule" && (
                    <ScheduleTab
                      requirements={requirements}
                      eventColor={eventColor}
                      eventStartDate={event?.start_date}
                      eventEndDate={event?.end_date || undefined}
                      eventType={event.event_type}
                    />
                  )}
                  {activeTab === "challenges" && (
                    <ChallengesTab
                      requirements={requirements}
                      eventColor={eventColor}
                      eventType={event.event_type}
                    />
                  )}
                  {activeTab === "prizes" && (
                    <PrizesTab
                      requirements={requirements}
                      eventColor={eventColor}
                      eventType={event.event_type}
                    />
                  )}
                  {activeTab === "info" && (
                    <InfoTab
                      requirements={requirements}
                      eventColor={eventColor}
                      eventDescription={event?.description || undefined}
                      eventVenue={event?.location || undefined}
                      organizerName={event?.organizer_name || undefined}
                      eventType={event.event_type}
                    />
                  )}
                </GlowCard>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Event Info Card */}
                <GlowCard glowColor={`${eventColor}25`} className="overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700" style={{ backgroundColor: `${eventColor}08` }}>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eventColor }} />
                      Event Info
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                      >
                        {Icons.calendar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Date & Time</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {new Date(event.start_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        {event.start_time && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(event.start_time)}
                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                      >
                        {event.is_virtual ? Icons.globe : Icons.location}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Location</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {event.is_virtual ? "Virtual Event" : (event.location || "TBA")}
                        </p>
                        {event.is_virtual && event.virtual_platform && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.virtual_platform}</p>
                        )}
                      </div>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                      >
                        {Icons.users}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Participants</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {event.attendees_count} registered
                          {event.max_attendees && <span className="text-gray-500 dark:text-gray-400"> / {event.max_attendees} max</span>}
                        </p>
                      </div>
                    </div>

                    {/* Join Button for Virtual Events */}
                    {event.is_virtual && event.virtual_link && (
                      <ShimmerButton
                        shimmerColor="rgba(255,255,255,0.3)"
                        shimmerSize="0.12em"
                        shimmerDuration="2s"
                        borderRadius="12px"
                        background={eventColor}
                        className="w-full py-3"
                        onClick={() => window.open(event.virtual_link!, '_blank')}
                      >
                        <span className="flex items-center gap-2">
                          {event.status === "in_progress" && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                          {event.status === "in_progress" ? "Join Now" : "Event Link"}
                          {Icons.arrow}
                        </span>
                      </ShimmerButton>
                    )}
                  </div>
                </GlowCard>

                {/* Quick Actions Card */}
                <GlowCard glowColor={`${eventColor}20`} className="overflow-hidden">
                  <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                  </div>
                  <div className="p-2">
                    {hasTeams && !team && (
                      <button
                        onClick={() => setActiveTab("teams")}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          {tabIcons.teams}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Join a Team</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Find teammates for the event</p>
                        </div>
                      </button>
                    )}
                    {hasSubmissions && !mySubmission && (
                      <button
                        onClick={() => setActiveTab("submissions")}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          {tabIcons.submissions}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Create Submission</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Start your project submission</p>
                        </div>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab("profile")}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all hover:scale-[1.02]"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {tabIcons.profile}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Edit Profile</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Update your information</p>
                      </div>
                    </button>
                  </div>
                </GlowCard>

                {/* About Card */}
                {event.description && (
                  <GlowCard glowColor={`${eventColor}20`} className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About Event</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-4">
                      {event.description}
                    </p>
                  </GlowCard>
                )}

                {/* Organizer Contact */}
                {(event.contact_email || event.contact_phone) && (
                  <GlowCard glowColor={`${eventColor}20`} className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Need Help?</h3>
                    <div className="space-y-2">
                      {event.contact_email && (
                        <a
                          href={`mailto:${event.contact_email}`}
                          className="flex items-center gap-2 text-sm hover:underline"
                          style={{ color: eventColor }}
                        >
                          {Icons.mail}
                          {event.contact_email}
                        </a>
                      )}
                      {event.contact_phone && (
                        <a
                          href={`tel:${event.contact_phone}`}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:underline"
                        >
                          {Icons.phone}
                          {event.contact_phone}
                        </a>
                      )}
                    </div>
                  </GlowCard>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN VIEW - Show Event Details + Auth */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Details - Modern Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlowCard glowColor={`${eventColor}40`} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      {Icons.calendar}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Date</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </GlowCard>

                <GlowCard glowColor={`${eventColor}40`} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      {event.is_virtual ? Icons.globe : Icons.location}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Location</p>
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {event.is_virtual ? "Online" : (event.location || "TBA")}
                  </p>
                </GlowCard>

                <GlowCard glowColor={`${eventColor}40`} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      {Icons.users}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Attendees</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {event.attendees_count}{event.max_attendees ? <span className="font-normal text-gray-500"> / {event.max_attendees}</span> : ""}
                  </p>
                </GlowCard>

                <GlowCard glowColor={`${eventColor}40`} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      {Icons.ticket}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Price</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {event.ticket_price ? `${event.currency || "USD"} ${event.ticket_price}` : "Free"}
                  </p>
                </GlowCard>
              </div>

              {/* Description */}
              {event.description && (
                <GlowCard glowColor={`${eventColor}30`} className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    About This Event
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed text-base">
                    {event.description}
                  </p>
                </GlowCard>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <GlowCard glowColor={`${eventColor}30`} className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    Topics
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: `${eventColor}15`,
                          color: eventColor,
                          boxShadow: `0 2px 8px ${eventColor}20`
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </GlowCard>
              )}

              {/* Hackathon Details with Tabs */}
              {event.event_type === "hackathon" && event.requirements && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Public Tab Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex overflow-x-auto">
                      {[
                        { id: "overview", label: "Overview", icon: tabIcons.dashboard },
                        { id: "schedule", label: "Schedule", icon: tabIcons.schedule },
                        { id: "challenges", label: "Challenges", icon: tabIcons.challenges },
                        { id: "prizes", label: "Prizes", icon: tabIcons.prizes },
                        { id: "info", label: "Info", icon: tabIcons.info },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPublicActiveTab(tab.id as typeof publicActiveTab)}
                          className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative ${
                            publicActiveTab === tab.id
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                        >
                          <span style={publicActiveTab === tab.id ? { color: eventColor } : undefined}>
                            {tab.icon}
                          </span>
                          <span className="hidden sm:inline">{tab.label}</span>
                          {publicActiveTab === tab.id && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                              style={{ backgroundColor: eventColor }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Public Tab Content */}
                  <div className="p-6">
                    {publicActiveTab === "overview" && (
                      <HackathonDetails
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        startDate={event.start_date || undefined}
                        endDate={event.end_date || undefined}
                      />
                    )}
                    {publicActiveTab === "schedule" && (
                      <ScheduleTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventStartDate={event.start_date}
                        eventEndDate={event.end_date || undefined}
                        eventType={event.event_type}
                      />
                    )}
                    {publicActiveTab === "challenges" && (
                      <ChallengesTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventType={event.event_type}
                      />
                    )}
                    {publicActiveTab === "prizes" && (
                      <PrizesTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventType={event.event_type}
                      />
                    )}
                    {publicActiveTab === "info" && (
                      <InfoTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventDescription={event.description || undefined}
                        eventVenue={event.location || undefined}
                        organizerName={event.organizer_name || undefined}
                        eventType={event.event_type}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Workshop Details with Tabs */}
              {event.event_type === "workshop" && event.requirements && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Public Tab Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex overflow-x-auto">
                      {[
                        { id: "overview", label: "Overview", icon: tabIcons.dashboard },
                        { id: "schedule", label: "Schedule", icon: tabIcons.schedule },
                        { id: "info", label: "Info", icon: tabIcons.info },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPublicActiveTab(tab.id as typeof publicActiveTab)}
                          className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative ${
                            publicActiveTab === tab.id
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                        >
                          <span style={publicActiveTab === tab.id ? { color: eventColor } : undefined}>
                            {tab.icon}
                          </span>
                          <span className="hidden sm:inline">{tab.label}</span>
                          {publicActiveTab === tab.id && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                              style={{ backgroundColor: eventColor }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Public Tab Content */}
                  <div className="p-6">
                    {publicActiveTab === "overview" && (
                      <WorkshopDetails
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        startDate={event.start_date || undefined}
                        endDate={event.end_date || undefined}
                      />
                    )}
                    {publicActiveTab === "schedule" && (
                      <ScheduleTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventStartDate={event.start_date}
                        eventEndDate={event.end_date || undefined}
                        eventType={event.event_type}
                      />
                    )}
                    {publicActiveTab === "info" && (
                      <InfoTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventDescription={event.description || undefined}
                        eventVenue={event.location || undefined}
                        organizerName={event.organizer_name || undefined}
                        eventType={event.event_type}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Meetup Details with Tabs */}
              {event.event_type === "meetup" && event.requirements && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Public Tab Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex overflow-x-auto">
                      {[
                        { id: "overview", label: "Overview", icon: tabIcons.dashboard },
                        { id: "schedule", label: "Schedule", icon: tabIcons.schedule },
                        { id: "info", label: "Info", icon: tabIcons.info },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPublicActiveTab(tab.id as typeof publicActiveTab)}
                          className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative ${
                            publicActiveTab === tab.id
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                        >
                          <span style={publicActiveTab === tab.id ? { color: eventColor } : undefined}>
                            {tab.icon}
                          </span>
                          <span className="hidden sm:inline">{tab.label}</span>
                          {publicActiveTab === tab.id && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                              style={{ backgroundColor: eventColor }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Public Tab Content */}
                  <div className="p-6">
                    {publicActiveTab === "overview" && (
                      <MeetupDetails
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        startDate={event.start_date || undefined}
                        endDate={event.end_date || undefined}
                      />
                    )}
                    {publicActiveTab === "schedule" && (
                      <ScheduleTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventStartDate={event.start_date}
                        eventEndDate={event.end_date || undefined}
                        eventType={event.event_type}
                      />
                    )}
                    {publicActiveTab === "info" && (
                      <InfoTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventDescription={event.description || undefined}
                        eventVenue={event.location || undefined}
                        organizerName={event.organizer_name || undefined}
                        eventType={event.event_type}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* General Event Details with Tabs */}
              {event.event_type === "general" && event.requirements && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Public Tab Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex overflow-x-auto">
                      {[
                        { id: "overview", label: "Overview", icon: tabIcons.dashboard },
                        { id: "schedule", label: "Schedule", icon: tabIcons.schedule },
                        { id: "info", label: "Info", icon: tabIcons.info },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPublicActiveTab(tab.id as typeof publicActiveTab)}
                          className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative ${
                            publicActiveTab === tab.id
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                        >
                          <span style={publicActiveTab === tab.id ? { color: eventColor } : undefined}>
                            {tab.icon}
                          </span>
                          <span className="hidden sm:inline">{tab.label}</span>
                          {publicActiveTab === tab.id && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                              style={{ backgroundColor: eventColor }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Public Tab Content */}
                  <div className="p-6">
                    {publicActiveTab === "overview" && (
                      <GeneralEventDetails
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        startDate={event.start_date || undefined}
                        endDate={event.end_date || undefined}
                      />
                    )}
                    {publicActiveTab === "schedule" && (
                      <ScheduleTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventStartDate={event.start_date}
                        eventEndDate={event.end_date || undefined}
                        eventType={event.event_type}
                      />
                    )}
                    {publicActiveTab === "info" && (
                      <InfoTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventDescription={event.description || undefined}
                        eventVenue={event.location || undefined}
                        organizerName={event.organizer_name || undefined}
                        eventType={event.event_type}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Game Jam Details with Tabs */}
              {event.event_type === "game_jam" && event.requirements && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Public Tab Navigation */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex overflow-x-auto">
                      {[
                        { id: "overview", label: "Overview", icon: tabIcons.dashboard },
                        { id: "schedule", label: "Schedule", icon: tabIcons.schedule },
                        { id: "prizes", label: "Prizes", icon: tabIcons.prizes },
                        { id: "info", label: "Info", icon: tabIcons.info },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPublicActiveTab(tab.id as typeof publicActiveTab)}
                          className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all relative ${
                            publicActiveTab === tab.id
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                        >
                          <span style={publicActiveTab === tab.id ? { color: eventColor } : undefined}>
                            {tab.icon}
                          </span>
                          <span className="hidden sm:inline">{tab.label}</span>
                          {publicActiveTab === tab.id && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                              style={{ backgroundColor: eventColor }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Public Tab Content */}
                  <div className="p-6">
                    {publicActiveTab === "overview" && (
                      <GameJamDetails
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        startDate={event.start_date || undefined}
                        endDate={event.end_date || undefined}
                      />
                    )}
                    {publicActiveTab === "schedule" && (
                      <ScheduleTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventStartDate={event.start_date}
                        eventEndDate={event.end_date || undefined}
                        eventType={event.event_type}
                      />
                    )}
                    {publicActiveTab === "prizes" && (
                      <PrizesTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventType={event.event_type}
                      />
                    )}
                    {publicActiveTab === "info" && (
                      <InfoTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventDescription={event.description || undefined}
                        eventVenue={event.location || undefined}
                        organizerName={event.organizer_name || undefined}
                        eventType={event.event_type}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Organizer */}
              {(event.organizer_name || event.contact_name || event.contact_email) && (
                <GlowCard glowColor={`${eventColor}30`} className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      {Icons.user}
                    </div>
                    Organizer
                  </h2>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: eventColor, boxShadow: `0 8px 24px ${eventColor}40` }}
                    >
                      {(event.organizer_name || event.contact_name || "O").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">
                        {event.organizer_name || event.contact_name || "Event Organizer"}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        {event.contact_email && (
                          <a
                            href={`mailto:${event.contact_email}`}
                            className="text-sm flex items-center gap-2 font-medium transition-all hover:gap-3"
                            style={{ color: eventColor }}
                          >
                            {Icons.mail}
                            Contact Organizer
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </GlowCard>
              )}
            </div>

            {/* Auth Sidebar - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Registration Status Banner */}
                  <div
                    className="p-4 text-center text-white"
                    style={{ backgroundColor: eventColor }}
                  >
                    {isFull ? (
                      <p className="font-semibold">Event is Full</p>
                    ) : spotsLeft && spotsLeft <= 10 ? (
                      <p className="font-semibold">Only {spotsLeft} spots left!</p>
                    ) : (
                      <p className="font-semibold">Join This Event</p>
                    )}
                  </div>

                  <div className="p-6">
                    {event.registration_required && !isFull ? (
                      <>
                        {/* Auth Tabs */}
                        <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                          <button
                            onClick={() => { setAuthMode("register"); setRegStep("details"); setAuthError(null); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                              authMode === "register"
                                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                            }`}
                          >
                            Register
                          </button>
                          <button
                            onClick={() => { setAuthMode("login"); setAuthError(null); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                              authMode === "login"
                                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                            }`}
                          >
                            Sign In
                          </button>
                        </div>

                        {authMode === "login" ? (
                          /* ── Login Form ── */
                          <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                              <input
                                type="email"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                placeholder="you@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={authPassword}
                                  onChange={(e) => setAuthPassword(e.target.value)}
                                  required
                                  minLength={6}
                                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                  placeholder="••••••••"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                >
                                  {showPassword ? Icons.eyeOff : Icons.eye}
                                </button>
                              </div>
                            </div>
                            {authError && (
                              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{authError}</div>
                            )}
                            <button
                              type="submit"
                              disabled={authSubmitting}
                              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                              style={{ backgroundColor: eventColor }}
                            >
                              {authSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>Sign In {Icons.arrow}</>
                              )}
                            </button>
                          </form>
                        ) : (
                          /* ── Register Wizard ── */
                          <div>
                            {/* Step Indicator */}
                            <div className="flex items-center justify-between mb-6">
                              {[
                                { key: "details", label: "Details" },
                                { key: "otp", label: "Verify" },
                                { key: "phone", label: "Phone" },
                              ].map((s, i) => {
                                const steps = ["details", "otp", "phone"];
                                const currentIdx = steps.indexOf(regStep);
                                const isDone = i < currentIdx;
                                const isActive = i === currentIdx;
                                return (
                                  <React.Fragment key={s.key}>
                                    {i > 0 && (
                                      <div className={`flex-1 h-0.5 mx-2 rounded ${isDone ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`} />
                                    )}
                                    <div className="flex flex-col items-center">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                          isDone
                                            ? "bg-green-500 text-white"
                                            : isActive
                                            ? "text-white"
                                            : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                                        }`}
                                        style={isActive ? { backgroundColor: eventColor } : undefined}
                                      >
                                        {isDone ? Icons.check : i + 1}
                                      </div>
                                      <span className={`text-[10px] mt-1 ${isActive ? "font-semibold text-gray-900 dark:text-white" : "text-gray-400"}`}>
                                        {s.label}
                                      </span>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>

                            {/* Step 1: Name + Email + Password */}
                            {regStep === "details" && (
                              <form onSubmit={handleRegSendOTP} className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                  <input
                                    type="text"
                                    value={authName}
                                    onChange={(e) => setAuthName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                    placeholder="Your name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                                  <input
                                    type="email"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                    placeholder="you@example.com"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                  <div className="relative">
                                    <input
                                      type={showPassword ? "text" : "password"}
                                      value={authPassword}
                                      onChange={(e) => setAuthPassword(e.target.value)}
                                      required
                                      minLength={6}
                                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                                      style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                      placeholder="••••••••"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      {showPassword ? Icons.eyeOff : Icons.eye}
                                    </button>
                                  </div>
                                </div>
                                {authError && (
                                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{authError}</div>
                                )}
                                <button
                                  type="submit"
                                  disabled={authSubmitting}
                                  className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                  style={{ backgroundColor: eventColor }}
                                >
                                  {authSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <>Continue {Icons.arrow}</>
                                  )}
                                </button>
                              </form>
                            )}

                            {/* Step 2: OTP Verification */}
                            {regStep === "otp" && (
                              <div className="space-y-4">
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${eventColor}15` }}>
                                    {Icons.mail}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Enter the 6-digit code sent to
                                  </p>
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm mt-1">{authEmail}</p>
                                </div>
                                <div className="flex gap-2 justify-center">
                                  {regOtp.map((d, i) => (
                                    <input
                                      key={i}
                                      ref={(el) => { otpRefs.current[i] = el; }}
                                      type="text"
                                      inputMode="numeric"
                                      maxLength={1}
                                      value={d}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        const next = [...regOtp];
                                        next[i] = val;
                                        setRegOtp(next);
                                        if (val && i < 5) otpRefs.current[i + 1]?.focus();
                                        if (val && i === 5 && next.join("").length === 6) handleRegVerifyOTP(next.join(""));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Backspace" && !regOtp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                                      }}
                                      onPaste={(e) => {
                                        e.preventDefault();
                                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                        const next = [...regOtp];
                                        for (let j = 0; j < pasted.length; j++) next[j] = pasted[j];
                                        setRegOtp(next);
                                        if (pasted.length === 6) handleRegVerifyOTP(pasted);
                                      }}
                                      className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                                      style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                    />
                                  ))}
                                </div>
                                {authError && (
                                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">{authError}</div>
                                )}
                                {authSubmitting && (
                                  <div className="flex justify-center">
                                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${eventColor}40`, borderTopColor: eventColor }} />
                                  </div>
                                )}
                                <div className="text-center">
                                  <button
                                    type="button"
                                    disabled={otpCooldown > 0}
                                    onClick={handleRegResendOTP}
                                    className="text-sm font-medium disabled:opacity-50 transition-colors"
                                    style={{ color: eventColor }}
                                  >
                                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend Code"}
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setRegStep("details"); setAuthError(null); }}
                                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  ← Back to details
                                </button>
                              </div>
                            )}

                            {/* Step 3: Phone Number */}
                            {regStep === "phone" && (
                              <form onSubmit={handleRegComplete} className="space-y-4">
                                <div className="text-center mb-2">
                                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${eventColor}15` }}>
                                    {Icons.phone}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Enter your phone number to complete registration
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                                  <div className="flex gap-2">
                                    <select
                                      value={regCountryCode}
                                      onChange={(e) => setRegCountryCode(e.target.value)}
                                      className="w-24 px-2 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 text-sm transition-all"
                                      style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                    >
                                      {REG_COUNTRY_CODES.map((c) => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                      ))}
                                    </select>
                                    <input
                                      type="tel"
                                      value={regPhone}
                                      onChange={(e) => { setRegPhone(e.target.value.replace(/[^\d\s-]/g, "")); setRegPhoneTouched(true); }}
                                      required
                                      className={`flex-1 px-4 py-3 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                                        regPhoneError ? "border-red-400" : "border-gray-200 dark:border-gray-600"
                                      }`}
                                      style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                      placeholder="50 123 4567"
                                    />
                                  </div>
                                  {regPhoneError && (
                                    <p className="text-xs text-red-500 mt-1">{regPhoneError}</p>
                                  )}
                                </div>
                                {authError && (
                                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{authError}</div>
                                )}
                                <button
                                  type="submit"
                                  disabled={authSubmitting || !!regPhoneError}
                                  className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                  style={{ backgroundColor: eventColor }}
                                >
                                  {authSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <>Complete Registration {Icons.arrow}</>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setRegStep("otp"); setAuthError(null); }}
                                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  ← Back
                                </button>
                              </form>
                            )}
                          </div>
                        )}

                        {/* Price Info */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Registration</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {event.ticket_price ? `${event.currency || "USD"} ${event.ticket_price}` : "Free"}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : isFull ? (
                      /* Event is full - show login option for existing registrations */
                      <div className="space-y-4">
                        <div className="text-center py-2">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            This event has reached capacity.
                          </p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                            Already registered? Log in below.
                          </p>
                        </div>

                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setAuthSubmitting(true);
                            setAuthError(null);
                            try {
                              const res = await fetch(`/api/events/public/${slug}/auth`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "login", email: authEmail, password: authPassword }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || "Login failed");
                              if (data.token) {
                                localStorage.setItem(`attendee_token_${slug}`, data.token);
                                refreshSession();
                              }
                            } catch (err) {
                              setAuthError(err instanceof Error ? err.message : "Login failed");
                            } finally {
                              setAuthSubmitting(false);
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              required
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                              placeholder="your@email.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Password
                            </label>
                            <input
                              type="password"
                              required
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                              placeholder="••••••••"
                            />
                          </div>

                          {authError && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                              {authError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={authSubmitting}
                            className="w-full py-3 text-white font-semibold rounded-xl disabled:opacity-50 transition-all shadow-lg"
                            style={{ backgroundColor: eventColor }}
                          >
                            {authSubmitting ? "Logging in..." : "Login"}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 dark:text-gray-400">
                          Registration is not required for this event.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Share Card */}
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Share this event with friends
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Powered by <span className="font-semibold">OneToOne Events</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <AttendeeProvider eventSlug={slug}>
      <EventPageContent />
    </AttendeeProvider>
  );
}
