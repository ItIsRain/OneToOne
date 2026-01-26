"use client";

import React, { useState } from "react";
import { PortalIcons } from "./PortalIcons";
import { SubmissionEditor } from "./SubmissionEditor";
import type { Team, Attendee, Submission, ProblemStatement } from "./types";

interface SubmissionsTabProps {
  submissions: Submission[];
  mySubmission: Submission | null;
  team: Team | null;
  attendee: Attendee;
  token: string;
  eventSlug: string;
  eventColor: string;
  requirements: Record<string, unknown>;
  problemStatements?: ProblemStatement[];
  onRefresh: () => void;
}

export const SubmissionsTab: React.FC<SubmissionsTabProps> = ({
  submissions,
  mySubmission,
  team,
  attendee,
  token,
  eventSlug,
  eventColor,
  requirements,
  problemStatements = [],
  onRefresh,
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const minTeamSize = (requirements.team_size_min as number) || 1;
  const needsTeam = minTeamSize > 1 && !team;
  const submissionDeadline = (requirements.submission_deadline || requirements.submissionDeadline) as string;
  const isDeadlinePassed = submissionDeadline && new Date(submissionDeadline) < new Date();

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      draft: {
        label: "Draft",
        color: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-100 dark:bg-gray-700",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      },
      submitted: {
        label: "Submitted",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      winner: {
        label: "Winner",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        ),
      },
    };
    return configs[status] || configs.draft;
  };

  const submittedProjects = submissions.filter(s => s.status !== "draft");
  const winners = submissions.filter(s => s.status === "winner");

  return (
    <div className="space-y-8">
      {/* My Submission - Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10" style={{ background: `radial-gradient(circle, ${eventColor}, transparent)` }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5" style={{ background: `radial-gradient(circle, ${eventColor}, transparent)` }} />

        <div className="relative p-6 md:p-8">
          {mySubmission ? (
            <>
              {/* Submitted Project View */}
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Project Icon */}
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg shrink-0"
                  style={{ backgroundColor: eventColor }}
                >
                  {mySubmission.title.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const config = getStatusConfig(mySubmission.status);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${config.bgColor} ${config.color}`}>
                              {config.icon}
                              {config.label}
                            </span>
                          );
                        })()}
                        {mySubmission.problem_statement && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {mySubmission.problem_statement.title}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{mySubmission.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{mySubmission.description || "No description provided"}</p>
                    </div>

                    {mySubmission.status === "draft" && !isDeadlinePassed && (
                      <button
                        onClick={() => setShowEditor(true)}
                        className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                        style={{ backgroundColor: eventColor, boxShadow: `0 4px 14px ${eventColor}40` }}
                      >
                        Continue Editing
                      </button>
                    )}
                  </div>

                  {/* Technologies */}
                  {mySubmission.technologies && mySubmission.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mySubmission.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg"
                          style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex flex-wrap gap-3">
                    {mySubmission.project_url && (
                      <a
                        href={mySubmission.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Source Code
                      </a>
                    )}
                    {mySubmission.demo_url && (
                      <a
                        href={mySubmission.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90"
                        style={{ backgroundColor: eventColor }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Demo
                      </a>
                    )}
                    {mySubmission.video_url && (
                      <a
                        href={mySubmission.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Watch Video
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Submission - Create CTA */
            <div className="text-center py-8">
              <div
                className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to Submit?</h3>

              {needsTeam ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    This event requires team participation. Join or create a team first to submit your project.
                  </p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Join a team first
                  </span>
                </>
              ) : isDeadlinePassed ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    The submission deadline has passed. Thank you for your interest!
                  </p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-xl text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Deadline passed
                  </span>
                </>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Showcase your innovative project to the world. Create your submission and compete for prizes!
                  </p>
                  <button
                    onClick={() => setShowEditor(true)}
                    className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                    style={{ backgroundColor: eventColor, boxShadow: `0 4px 14px ${eventColor}40` }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your Submission
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Winners Showcase */}
      {winners.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Winners</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Congratulations to the winning projects!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {winners.map((sub) => (
              <div
                key={sub.id}
                className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 rounded-2xl border-2 border-yellow-200 dark:border-yellow-700/50 p-5"
              >
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-400 text-yellow-900">
                    Winner
                  </span>
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md"
                    style={{ backgroundColor: eventColor }}
                  >
                    {sub.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{sub.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {sub.team?.name || sub.attendee?.name}
                    </p>
                  </div>
                </div>
                {sub.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{sub.description}</p>
                )}
                {sub.project_url && (
                  <a
                    href={sub.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                    style={{ color: eventColor }}
                  >
                    View Project
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Submissions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Submissions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {submittedProjects.length} project{submittedProjects.length !== 1 ? "s" : ""} submitted
              </p>
            </div>
          </div>
        </div>

        {submittedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {submittedProjects.filter(s => s.status !== "winner").map((sub) => (
              <div
                key={sub.id}
                className="group bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: eventColor }}
                    >
                      {sub.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-clip">
                        {sub.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by {sub.team?.name || sub.attendee?.name}
                      </p>
                    </div>
                  </div>

                  {sub.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {sub.description}
                    </p>
                  )}

                  {/* Technologies */}
                  {sub.technologies && sub.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {sub.technologies.slice(0, 3).map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        >
                          {tech}
                        </span>
                      ))}
                      {sub.technologies.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                          +{sub.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center gap-2">
                    {sub.project_url && (
                      <a
                        href={sub.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                        style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Code
                      </a>
                    )}
                    {sub.demo_url && (
                      <a
                        href={sub.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Demo
                      </a>
                    )}
                    {sub.video_url && (
                      <a
                        href={sub.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                        Video
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No submissions yet</h4>
            <p className="text-gray-500 dark:text-gray-400">Be the first to submit your project and inspire others!</p>
          </div>
        )}
      </div>

      {/* Submission Editor Modal */}
      {showEditor && (
        <SubmissionEditor
          submission={mySubmission}
          problemStatements={problemStatements}
          token={token}
          eventSlug={eventSlug}
          eventColor={eventColor}
          onClose={() => setShowEditor(false)}
          onSave={() => { setShowEditor(false); onRefresh(); }}
        />
      )}
    </div>
  );
};
