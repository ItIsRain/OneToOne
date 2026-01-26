"use client";

import React, { useState } from "react";
import { useAttendee } from "@/context/AttendeeContext";
import type { Attendee } from "./types";

interface ProfileTabProps {
  attendee: Attendee;
  eventColor: string;
  requirements?: Record<string, unknown>;
  eventType?: string;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ attendee, eventColor, requirements = {}, eventType = "hackathon" }) => {
  const { updateProfile } = useAttendee();

  // Check if this is a competition event (hackathon/game_jam)
  const isCompetitionEvent = ["hackathon", "game_jam"].includes(eventType);

  // Check if this is a solo event (no teams needed)
  const minTeamSize = (requirements.team_size_min as number) || 1;
  const maxTeamSize = (requirements.team_size_max as number) || 5;
  const isSoloEvent = minTeamSize === 1 && maxTeamSize === 1;

  // Show team-related sections only for competition events with teams
  const showTeamSections = isCompetitionEvent && !isSoloEvent;
  const [formData, setFormData] = useState({
    name: attendee.name || "",
    company: attendee.company || "",
    job_title: attendee.job_title || "",
    bio: attendee.bio || "",
    skills: attendee.skills?.join(", ") || "",
    looking_for_team: attendee.looking_for_team || false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateProfile({
      name: formData.name,
      company: formData.company || undefined,
      job_title: formData.job_title || undefined,
      bio: formData.bio || undefined,
      skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : [],
      looking_for_team: formData.looking_for_team,
    });

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update profile" });
    }
    setLoading(false);
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{ background: `radial-gradient(circle, ${eventColor}, transparent)` }} />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg"
                style={{ backgroundColor: eventColor }}
              >
                {attendee.name?.charAt(0).toUpperCase()}
              </div>
              <button
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Change avatar (coming soon)"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{attendee.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-3">{attendee.email}</p>
              {isCompetitionEvent && formData.looking_for_team && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Looking for a team
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Your Profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Help others get to know you better
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Personal Info Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClasses}
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className={inputClasses}
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className={inputClasses}
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section - Only for competition events */}
          {isCompetitionEvent && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Skills & Expertise
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Skills
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className={inputClasses}
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="React, Python, Machine Learning, UI/UX Design..."
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Separate skills with commas. These help teammates find you.
                </p>
              </div>

              {/* Skill Preview */}
              {formData.skills && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {formData.skills.split(",").map((skill, i) => (
                    skill.trim() && (
                      <span
                        key={i}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg"
                        style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                      >
                        {skill.trim()}
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bio Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              About You
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className={`${inputClasses} resize-none`}
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                placeholder="Tell others about yourself, your interests, and what you're excited to build..."
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>

          {/* Team Preferences - Only show for competition events with teams */}
          {showTeamSections && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Team Preferences
              </h4>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, looking_for_team: !formData.looking_for_team })}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  formData.looking_for_team
                    ? ""
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                style={{
                  borderColor: formData.looking_for_team ? eventColor : undefined,
                  backgroundColor: formData.looking_for_team ? `${eventColor}08` : undefined,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      formData.looking_for_team ? "" : "bg-gray-100 dark:bg-gray-700"
                    }`}
                    style={{
                      backgroundColor: formData.looking_for_team ? `${eventColor}20` : undefined,
                      color: formData.looking_for_team ? eventColor : undefined,
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Looking for a team</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Let others know you're interested in joining a team
                    </p>
                  </div>
                </div>
                <div
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    formData.looking_for_team ? "" : "bg-gray-200 dark:bg-gray-600"
                  }`}
                  style={{ backgroundColor: formData.looking_for_team ? eventColor : undefined }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      formData.looking_for_team ? "translate-x-5" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          )}

          {/* Success/Error Message */}
          {message && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
              }`}
            >
              {message.type === "success" ? (
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white font-semibold rounded-xl disabled:opacity-50 hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: eventColor, boxShadow: `0 4px 14px ${eventColor}40` }}
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Changes...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
