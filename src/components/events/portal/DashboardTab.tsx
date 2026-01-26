"use client";

import React from "react";
import type { Attendee, Team, Submission, TabType } from "./types";

interface DashboardTabProps {
  attendee: Attendee;
  team: Team | null;
  teamRole: string | null;
  mySubmission: Submission | null;
  needsTeam: boolean;
  eventColor: string;
  eventSlug: string;
  requirements: Record<string, unknown>;
  onNavigate: (tab: TabType) => void;
  eventTitle?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  eventType?: string;
}

// Helper function to format date safely
function formatDate(dateValue: unknown, options?: Intl.DateTimeFormatOptions): string | null {
  if (!dateValue) return null;
  let date: Date;
  if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else if (typeof dateValue === 'number') {
    date = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return null;
  }
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", options || {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  attendee,
  team,
  teamRole,
  mySubmission,
  needsTeam,
  eventColor,
  eventSlug,
  requirements,
  onNavigate,
  eventStartDate,
  eventEndDate,
  eventType = "hackathon",
}) => {
  // Determine if this is a competition-type event (has teams/submissions)
  const isCompetitionEvent = ["hackathon", "game_jam"].includes(eventType);

  // Extract requirements data
  const submissionDeadline = requirements.submission_deadline || requirements.submissionDeadline;
  const isDeadlinePassed = submissionDeadline && new Date(submissionDeadline as string) < new Date();
  const formattedDeadline = isCompetitionEvent ? formatDate(submissionDeadline) : null;

  // Team configuration - only relevant for competition events
  const minSize = (requirements.team_size_min as number) || 1;
  const maxSize = (requirements.team_size_max as number) || 5;
  const isSolo = minSize === 1 && maxSize === 1;

  const getProgress = () => {
    // For non-competition events, just registration is needed
    if (!isCompetitionEvent) {
      return { completed: 1, total: 1, percentage: 100 };
    }

    let completed = 1; // Registration
    let total = isSolo ? 2 : 3;
    if (!isSolo && team) completed++;
    if (mySubmission?.status === "submitted") completed++;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const progress = getProgress();

  return (
    <div className="space-y-8">
      {/* Welcome Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10" style={{ background: `radial-gradient(circle, ${eventColor}, transparent)` }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 opacity-5" style={{ background: `radial-gradient(circle, ${eventColor}, transparent)` }} />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg"
                style={{ backgroundColor: eventColor }}
              >
                {attendee.name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    Welcome back, {attendee.name?.split(" ")[0]}!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{attendee.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progress</p>
                  <p className="text-2xl font-bold" style={{ color: eventColor }}>{progress.percentage}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%`, backgroundColor: eventColor }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {progress.completed} of {progress.total} steps completed
                </p>
              </div>

              {/* Skills */}
              {attendee.skills && attendee.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attendee.skills.slice(0, 5).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg"
                      style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                    >
                      {skill}
                    </span>
                  ))}
                  {attendee.skills.length > 5 && (
                    <span className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      +{attendee.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards Grid */}
      {isCompetitionEvent ? (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isSolo ? '' : 'lg:grid-cols-3'} gap-6`}>
          {/* Registration Status */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Complete
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Registration</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You're registered for this event</p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {attendee.company ? `${attendee.job_title || "Member"} at ${attendee.company}` : "Participant"}
            </div>
          </div>

          {/* Team Status - Only show if not a solo-only event */}
          {!isSolo ? (
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    team ? "" : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                  }`}
                  style={team ? { backgroundColor: `${eventColor}15`, color: eventColor } : undefined}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                {team ? (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    Complete
                  </span>
                ) : needsTeam ? (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    Required
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                    Optional
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Team Status</h3>
              {team ? (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You're part of {team.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-0.5 text-xs rounded-full capitalize" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      {teamRole}
                    </span>
                    <span>{team.memberCount || 0}/{team.max_members} members</span>
                  </div>
                </>
              ) : needsTeam ? (
                <>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">Join or create a team to continue</p>
                  <button
                    onClick={() => onNavigate("teams")}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: eventColor }}
                  >
                    Browse Teams →
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Teams are optional for this event</p>
                  <button
                    onClick={() => onNavigate("teams")}
                    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    Browse teams →
                  </button>
                </>
              )}
            </div>
          ) : null}

          {/* Submission Status */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  mySubmission?.status === "submitted" || mySubmission?.status === "winner"
                    ? ""
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                }`}
                style={
                  mySubmission?.status === "submitted" || mySubmission?.status === "winner"
                    ? { backgroundColor: `${eventColor}15`, color: eventColor }
                    : undefined
                }
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {mySubmission?.status === "submitted" ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Submitted
                </span>
              ) : mySubmission?.status === "winner" ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                  Winner
                </span>
              ) : mySubmission?.status === "draft" ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  Draft
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                  Pending
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Submission</h3>
            {mySubmission ? (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">{mySubmission.title}</p>
                <button
                  onClick={() => onNavigate("submissions")}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: eventColor }}
                >
                  View Details →
                </button>
              </>
            ) : isDeadlinePassed ? (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">Deadline has passed</p>
            ) : needsTeam && !team ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Join a team first</p>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start working on your project</p>
                <button
                  onClick={() => onNavigate("submissions")}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: eventColor }}
                >
                  Create Submission →
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Workshop/Non-competition event dashboard */
        <div className="space-y-6">
          {/* Registration Confirmed */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">You're all set!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your registration is confirmed. See you at the event!
                </p>
              </div>
            </div>
          </div>

          {/* Workshop Quick Info */}
          {eventType === "workshop" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Skill Level */}
              {requirements.skill_level ? (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Skill Level</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {String(requirements.skill_level).replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Workshop Format */}
              {requirements.workshop_format ? (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Format</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {String(requirements.workshop_format).replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Certificate */}
              {requirements.certification ? (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Certificate</p>
                      <p className="font-semibold text-gray-900 dark:text-white">Provided upon completion</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Instructor */}
              {requirements.instructor_name ? (
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Instructor</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{String(requirements.instructor_name)}</p>
                      {requirements.instructor_title ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{String(requirements.instructor_title)}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Quick Links for Workshops */}
          {eventType === "workshop" && (
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Before the Workshop</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onNavigate("schedule")}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">View Schedule</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Check the agenda</p>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate("info")}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Workshop Details</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">What to bring & install</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Dates */}
      {(eventStartDate || eventEndDate) ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span> Key Dates
          </h3>
          <div className={`grid grid-cols-1 ${isCompetitionEvent ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
            {eventStartDate ? (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Event Starts</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {formatDate(eventStartDate, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : null}
            {eventEndDate ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Event Ends</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {formatDate(eventEndDate, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : null}
            {isCompetitionEvent && (
              <div className={`p-4 rounded-xl border ${isDeadlinePassed ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : formattedDeadline ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <p className={`text-xs font-medium mb-1 ${isDeadlinePassed ? 'text-gray-500' : formattedDeadline ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>
                  Submission {isDeadlinePassed ? 'Closed' : 'Deadline'}
                </p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {formattedDeadline || 'To be announced'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate("schedule")}
            className="mt-4 text-sm font-medium hover:underline"
            style={{ color: eventColor }}
          >
            View full schedule →
          </button>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className={`grid grid-cols-2 ${isCompetitionEvent ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
          <button
            onClick={() => onNavigate("schedule")}
            className="group p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all text-left"
          >
            <div
              className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Schedule</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{isCompetitionEvent ? 'Event timeline' : 'View agenda'}</p>
          </button>

          {isCompetitionEvent && (
            <>
              <button
                onClick={() => onNavigate("challenges")}
                className="group p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all text-left"
              >
                <div
                  className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Challenges</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Problem statements</p>
              </button>

              <button
                onClick={() => onNavigate("prizes")}
                className="group p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all text-left"
              >
                <div
                  className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Prizes</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Awards & judging</p>
              </button>

              <button
                onClick={() => onNavigate("submissions")}
                className="group p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all text-left"
              >
                <div
                  className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Submissions</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View all projects</p>
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate("info")}
            className="group p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all text-left"
          >
            <div
              className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Info</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Event details</p>
          </button>

          <button
            onClick={() => onNavigate("profile")}
            className="group p-5 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all text-left"
          >
            <div
              className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Profile</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your info</p>
          </button>
        </div>
      </div>

      {/* Tips Section - Different content based on event type */}
      {isCompetitionEvent ? (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pro Tips for Success</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>1.</span>
                  Check out the Challenges tab to understand what problem you'll solve
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>2.</span>
                  Review the Prizes tab to see judging criteria and what evaluators look for
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>3.</span>
                  Start your submission early and save drafts regularly
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>4.</span>
                  Include a demo video to make your project stand out
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What to Expect</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>-</span>
                  Check the Schedule tab for the event agenda
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>-</span>
                  Review the Info tab for venue details and resources
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>-</span>
                  Arrive a few minutes early to get settled
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: eventColor }}>-</span>
                  Bring any materials mentioned in the event info
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
