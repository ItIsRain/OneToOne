"use client";

import React from "react";

interface ScheduleTabProps {
  requirements: Record<string, unknown>;
  eventColor: string;
  eventStartDate?: string;
  eventEndDate?: string;
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
}) => {
  const schedule = Array.isArray(requirements.schedule)
    ? requirements.schedule as Array<{key: string; value: string}>
    : [];
  const submissionDeadline = requirements.submission_deadline || requirements.submissionDeadline;
  const formattedDeadline = formatDate(submissionDeadline);
  const isDeadlinePassed = submissionDeadline && new Date(submissionDeadline as string) < new Date();
  const demoTimePerTeam = requirements.demo_time_per_team as number | undefined;

  const hasSchedule = schedule.length > 0;

  return (
    <div className="space-y-6">
      {/* Important Dates */}
      {(eventStartDate || eventEndDate) ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">&#128197;</span> Important Dates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {eventStartDate ? (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Event Starts</p>
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
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Event Ends</p>
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
          </div>
        </div>
      ) : null}

      {/* Event Timeline */}
      {hasSchedule ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-xl">&#128336;</span> Event Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
            <div className="space-y-6">
              {schedule.map((item, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold z-10 shrink-0 shadow-lg"
                    style={{ backgroundColor: eventColor }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{item.key}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Schedule Coming Soon</h4>
          <p className="text-gray-500 dark:text-gray-400">The detailed event schedule will be announced soon.</p>
        </div>
      )}

      {/* Demo Time Info */}
      {demoTimePerTeam ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-2xl">
              &#9201;
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
