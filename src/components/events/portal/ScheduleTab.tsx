"use client";

import React from "react";

interface ScheduleTabProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  eventStartDate?: string;
  eventEndDate?: string;
  eventType?: string;
}

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

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  requirements,
  eventColor,
  eventStartDate,
  eventEndDate,
  eventType = "hackathon",
}) => {
  const isWorkshop = eventType === "workshop";
  const isMeetup = eventType === "meetup";
  const isGeneral = eventType === "general";
  const isGameJam = eventType === "game_jam";
  const isHackathon = eventType === "hackathon";
  const isCompetitionEvent = ["hackathon", "game_jam"].includes(eventType);
  const usesAgenda = isWorkshop || isMeetup || isGeneral;
  // Only show submission deadline for hackathons (game jams don't typically have this field)
  const showSubmissionDeadline = isHackathon;

  // Use agenda for workshops, meetups, and general events; schedule for others
  const schedule = Array.isArray(requirements.schedule)
    ? requirements.schedule as Array<{key: string; value: string}>
    : [];
  const agenda = Array.isArray(requirements.agenda)
    ? requirements.agenda as Array<{key: string; value: string}>
    : [];

  // Use agenda for workshop/meetup/general if available, otherwise use schedule
  const timelineItems = usesAgenda && agenda.length > 0 ? agenda : schedule;

  const submissionDeadline = requirements.submission_deadline || requirements.submissionDeadline;
  const formattedDeadline = showSubmissionDeadline ? formatDate(submissionDeadline) : null;
  const isDeadlinePassed = submissionDeadline && new Date(submissionDeadline as string) < new Date();
  const demoTimePerTeam = requirements.demo_time_per_team as number | undefined;

  const hasSchedule = timelineItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Important Dates */}
      {(eventStartDate || eventEndDate) ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span> Important Dates
          </h3>
          <div className={`grid grid-cols-1 ${showSubmissionDeadline ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
            {eventStartDate ? (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                      {isWorkshop ? 'Workshop Starts' : isMeetup ? 'Meetup Starts' : 'Event Starts'}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatDate(eventStartDate, { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(eventStartDate, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {eventEndDate ? (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {isWorkshop ? 'Workshop Ends' : isMeetup ? 'Meetup Ends' : 'Event Ends'}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatDate(eventEndDate, { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(eventEndDate, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Submission Deadline - Only for hackathons */}
            {showSubmissionDeadline && (
              <div className={`p-4 rounded-xl border ${isDeadlinePassed ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : formattedDeadline ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDeadlinePassed ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : formattedDeadline ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${isDeadlinePassed ? 'text-gray-500' : formattedDeadline ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>
                      Submission {isDeadlinePassed ? 'Closed' : 'Deadline'}
                    </p>
                    {formattedDeadline ? (
                      <>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {formatDate(submissionDeadline, { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(submissionDeadline, { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium text-gray-500 dark:text-gray-400">
                        To be announced
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Event Timeline / Workshop Agenda */}
      {hasSchedule ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-xl" style={{ color: eventColor }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span> {isWorkshop ? 'Workshop Agenda' : isMeetup ? 'Meetup Schedule' : isGeneral ? 'Event Schedule' : 'Event Timeline'}
          </h3>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" style={{ background: `linear-gradient(to bottom, ${eventColor}30, ${eventColor}60, ${eventColor}30)` }} />
            <div className="space-y-4">
              {timelineItems.map((item, i) => (
                <div key={i} className="flex gap-4 relative group">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold z-10 shrink-0 shadow-lg transition-transform group-hover:scale-105"
                    style={{ backgroundColor: eventColor }}
                  >
                    {isWorkshop ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 transition-all group-hover:shadow-md group-hover:bg-gray-100 dark:group-hover:bg-gray-700">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className="px-2.5 py-1 text-xs font-bold rounded-lg"
                        style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
                      >
                        {item.key}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mt-2">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Demo Time Info - Only for competition events */}
      {isCompetitionEvent && demoTimePerTeam ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="13" r="8" strokeWidth={1.5} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4l2 2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 2h4M12 2v3" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Presentation Time</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Each team gets <strong className="text-blue-600 dark:text-blue-400">{demoTimePerTeam} minutes</strong> to present their project
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
