"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEventTypeConfig, getPublicFields } from "@/config/eventTypeSchema";
import type { FormField } from "@/config/eventTypeSchema";
import { AttendeeProvider, useAttendee } from "@/context/AttendeeContext";
import { getPortalTabsForEventType } from "@/config/portalTabConfig";
import { DashboardTab, TeamsTab, SubmissionsTab, ProfileTab, ScheduleTab, ChallengesTab, PrizesTab, InfoTab, PortalIcons } from "@/components/events/portal";
import type { Team, Attendee, Submission, TabType } from "@/components/events/portal/types";

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
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 text-2xl">
                🏆
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
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 text-2xl">
                🎯
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
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 text-2xl">
                💡
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
              <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 text-2xl">
                🧑‍🏫
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
            <span className="text-xl">💡</span> Problem Statements
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
            <span className="text-xl">📅</span> Event Schedule
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
            <span className="text-xl">⏰</span> Important Dates
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
            <span className="text-xl">🏆</span> Prizes & Awards
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
                    <span className="text-2xl">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}
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
                      <span>⭐</span> {award.key}
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
            <span className="text-xl">⚖️</span> Judging
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
                <span className="text-lg">⏱️</span>
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
            <span className="text-xl">🎯</span> Themes & Technologies
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
          <span className="text-xl">👥</span> Participation Details
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
            <span className="text-xl">🎁</span> Resources Provided
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resourcesProvided.map((resource, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700 dark:text-gray-300">{resource}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
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

  // Handle auth
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);

    try {
      const body = authMode === "login"
        ? { action: "login", email: authEmail, password: authPassword }
        : { action: "register", email: authEmail, password: authPassword, name: authName };

      const res = await fetch(`/api/events/public/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store token and refresh
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Compact Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${eventColor} 0%, ${eventColor}dd 50%, ${eventColor}aa 100%)`
        }}
      >
        {event.cover_image && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${event.cover_image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                  {eventTypeLabel}
                </span>
                {event.status === "upcoming" && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/80 text-white">
                    Upcoming
                  </span>
                )}
                {event.status === "in_progress" && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm md:text-base">
                <span className="flex items-center gap-2">
                  {Icons.calendar}
                  {formatDate(event.start_date)}
                </span>
                {event.start_time && (
                  <span className="flex items-center gap-2">
                    {Icons.clock}
                    {formatTime(event.start_time)}
                  </span>
                )}
              </div>
            </div>

            {/* User info if logged in */}
            {isAuthenticated && attendee && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  {attendee.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-white font-medium text-sm">{attendee.name}</p>
                  <p className="text-white/70 text-xs">Registered</p>
                </div>
                <button
                  onClick={logout}
                  className="ml-2 p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                    />
                  )}
                  {activeTab === "schedule" && (
                    <ScheduleTab
                      requirements={requirements}
                      eventColor={eventColor}
                      eventStartDate={event?.start_date}
                      eventEndDate={event?.end_date || undefined}
                    />
                  )}
                  {activeTab === "challenges" && (
                    <ChallengesTab
                      requirements={requirements}
                      eventColor={eventColor}
                    />
                  )}
                  {activeTab === "prizes" && (
                    <PrizesTab
                      requirements={requirements}
                      eventColor={eventColor}
                    />
                  )}
                  {activeTab === "info" && (
                    <InfoTab
                      requirements={requirements}
                      eventColor={eventColor}
                      eventDescription={event?.description || undefined}
                      eventVenue={event?.location || undefined}
                      organizerName={event?.organizer_name || undefined}
                    />
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Event Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                      <a
                        href={event.virtual_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-medium transition-all hover:opacity-90"
                        style={{ backgroundColor: eventColor }}
                      >
                        {event.status === "in_progress" && (
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        )}
                        {event.status === "in_progress" ? "Join Now" : "Event Link"}
                        {Icons.arrow}
                      </a>
                    )}
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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
                </div>

                {/* About Card */}
                {event.description && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About Event</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-4">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Organizer Contact */}
                {(event.contact_email || event.contact_phone) && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
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
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN VIEW - Show Event Details + Auth */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      {Icons.calendar}
                      <span className="text-xs font-medium">Date</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      {event.is_virtual ? Icons.globe : Icons.location}
                      <span className="text-xs font-medium">Location</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {event.is_virtual ? "Online" : (event.location || "TBA")}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      {Icons.users}
                      <span className="text-xs font-medium">Attendees</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {event.attendees_count}{event.max_attendees ? ` / ${event.max_attendees}` : ""}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                      {Icons.ticket}
                      <span className="text-xs font-medium">Price</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {event.ticket_price ? `${event.currency || "USD"} ${event.ticket_price}` : "Free"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About This Event</h2>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
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
                      />
                    )}
                    {publicActiveTab === "challenges" && (
                      <ChallengesTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                      />
                    )}
                    {publicActiveTab === "prizes" && (
                      <PrizesTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                      />
                    )}
                    {publicActiveTab === "info" && (
                      <InfoTab
                        requirements={event.requirements as Record<string, unknown>}
                        eventColor={eventColor}
                        eventDescription={event.description || undefined}
                        eventVenue={event.location || undefined}
                        organizerName={event.organizer_name || undefined}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Organizer */}
              {(event.organizer_name || event.contact_name || event.contact_email) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organizer</h2>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                      style={{ backgroundColor: eventColor }}
                    >
                      {(event.organizer_name || event.contact_name || "O").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {event.organizer_name || event.contact_name || "Event Organizer"}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        {event.contact_email && (
                          <a
                            href={`mailto:${event.contact_email}`}
                            className="text-sm flex items-center gap-1 hover:underline"
                            style={{ color: eventColor }}
                          >
                            {Icons.mail}
                            Contact
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
                            onClick={() => setAuthMode("register")}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                              authMode === "register"
                                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                            }`}
                          >
                            Register
                          </button>
                          <button
                            onClick={() => setAuthMode("login")}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                              authMode === "login"
                                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                            }`}
                          >
                            Sign In
                          </button>
                        </div>

                        {/* Auth Form */}
                        <form onSubmit={handleAuth} className="space-y-4">
                          {authMode === "register" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={authName}
                                onChange={(e) => setAuthName(e.target.value)}
                                required={authMode === "register"}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                                placeholder="Your name"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Email
                            </label>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Password
                            </label>
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
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                              {authError}
                            </div>
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
                              <>
                                {authMode === "register" ? "Create Account" : "Sign In"}
                                {Icons.arrow}
                              </>
                            )}
                          </button>
                        </form>

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
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 dark:text-gray-400">
                          {isFull ? "This event has reached capacity." : "Registration is not required for this event."}
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
      <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        Powered by OneToOne Events
      </div>
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
