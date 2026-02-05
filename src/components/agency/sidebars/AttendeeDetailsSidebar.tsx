"use client";

import React, { useState } from "react";

interface Attendee {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;
  skills?: string[];
  bio?: string;
  status: string;
  looking_for_team?: boolean;
  registered_at: string;
  last_login_at?: string;
  team?: { id: string; name: string } | null;
  team_role?: string | null;
  submission?: { id: string; title: string; status: string } | null;
}

interface AttendeeDetailsSidebarProps {
  attendee: Attendee;
  eventId: string;
  eventType: string;
  onClose: () => void;
  onUpdate: (data: Partial<Attendee>) => void;
  onDelete: () => void;
  onConvertToLead: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  declined: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
  maybe: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  attended: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  no_show: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function AttendeeDetailsSidebar({
  attendee,
  eventId,
  eventType,
  onClose,
  onUpdate,
  onDelete,
  onConvertToLead,
}: AttendeeDetailsSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: attendee.name,
    phone: attendee.phone || "",
    company: attendee.company || "",
    job_title: attendee.job_title || "",
    bio: attendee.bio || "",
    skills: attendee.skills?.join(", ") || "",
  });

  const isTeamEvent = eventType === "hackathon" || eventType === "game_jam";

  const handleSave = () => {
    onUpdate({
      name: formData.name,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      job_title: formData.job_title || undefined,
      bio: formData.bio || undefined,
      skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : [],
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-xl h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendee Details</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {attendee.avatar_url ? (
                <img src={attendee.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                attendee.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{attendee.name}</h4>
              <p className="text-gray-500 dark:text-gray-400">{attendee.email}</p>
              <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${statusColors[attendee.status]}`}>
                {attendee.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Status Actions */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Update Status
            </label>
            <div className="flex gap-2">
              {["pending", "confirmed", "declined", "maybe", "attended", "no_show"].map((status) => (
                <button
                  key={status}
                  onClick={() => onUpdate({ status })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                    attendee.status === status
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 mb-6">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Contact Information
            </h5>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {attendee.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{attendee.phone}</span>
                  </div>
                )}
                {attendee.company && (
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {attendee.job_title ? `${attendee.job_title} at ` : ""}{attendee.company}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Edit Details
                </button>
              </div>
            )}
          </div>

          {/* Skills */}
          {attendee.skills && attendee.skills.length > 0 && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Skills
              </h5>
              <div className="flex flex-wrap gap-2">
                {attendee.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {attendee.bio && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Bio
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">{attendee.bio}</p>
            </div>
          )}

          {/* Team Info (for hackathons) */}
          {isTeamEvent && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Team
              </h5>
              {attendee.team ? (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="font-medium text-gray-900 dark:text-white">{attendee.team.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">Role: {attendee.team_role}</p>
                </div>
              ) : attendee.looking_for_team ? (
                <p className="text-sm text-purple-600 dark:text-purple-400">Looking for a team</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Solo participant</p>
              )}
            </div>
          )}

          {/* Submission Info (for hackathons) */}
          {isTeamEvent && attendee.submission && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Submission
              </h5>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="font-medium text-gray-900 dark:text-white">{attendee.submission.title}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full capitalize ${
                  attendee.submission.status === "winner"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : attendee.submission.status === "submitted"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400"
                }`}>
                  {attendee.submission.status}
                </span>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
              Activity
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Registered</span>
                <span className="text-gray-700 dark:text-gray-300">{formatDate(attendee.registered_at)}</span>
              </div>
              {attendee.last_login_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Last Login</span>
                  <span className="text-gray-700 dark:text-gray-300">{formatDate(attendee.last_login_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onConvertToLead}
              className="w-full py-2.5 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Convert to CRM Lead
            </button>
            <button
              onClick={onDelete}
              className="w-full py-2.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              Remove Attendee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
