"use client";

import React from "react";

interface Attendee {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;
  skills?: string[];
  status: string;
  looking_for_team?: boolean;
  registered_at: string;
  team?: { id: string; name: string } | null;
  team_role?: string | null;
  submission?: { id: string; title: string; status: string } | null;
}

interface EventAttendeesTableProps {
  attendees: Attendee[];
  eventType: string;
  onView: (attendee: Attendee) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onConvertToLead: (id: string) => void;
}

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  attended: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  no_show: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function EventAttendeesTable({
  attendees,
  eventType,
  onView,
  onUpdateStatus,
  onDelete,
  onConvertToLead,
}: EventAttendeesTableProps) {
  const isTeamEvent = eventType === "hackathon" || eventType === "game_jam";

  if (attendees.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">No attendees registered yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Attendee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              {isTeamEvent && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
              )}
              {isTeamEvent && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submission
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {attendees.map((attendee) => (
              <tr
                key={attendee.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                onClick={() => onView(attendee)}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {attendee.avatar_url ? (
                        <img src={attendee.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        attendee.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{attendee.name}</p>
                      {attendee.company && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {attendee.job_title ? `${attendee.job_title} at ` : ""}{attendee.company}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-900 dark:text-white">{attendee.email}</p>
                  {attendee.phone && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{attendee.phone}</p>
                  )}
                </td>
                {isTeamEvent && (
                  <td className="px-4 py-4">
                    {attendee.team ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{attendee.team.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{attendee.team_role}</p>
                      </div>
                    ) : attendee.looking_for_team ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Looking for team
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Solo</span>
                    )}
                  </td>
                )}
                {isTeamEvent && (
                  <td className="px-4 py-4">
                    {attendee.submission ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {attendee.submission.title}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          attendee.submission.status === "submitted"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : attendee.submission.status === "winner"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          {attendee.submission.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No submission</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusColors[attendee.status] || statusColors.confirmed}`}>
                    {attendee.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(attendee.registered_at)}
                </td>
                <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={attendee.status}
                      onChange={(e) => onUpdateStatus(attendee.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="attended">Attended</option>
                      <option value="no_show">No Show</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => onConvertToLead(attendee.id)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Convert to Lead"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(attendee.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
