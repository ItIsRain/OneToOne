"use client";

import React, { useState } from "react";
import type { TeamJoinType } from "./types";

interface CreateTeamModalProps {
  eventColor: string;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    join_type: TeamJoinType;
    join_code?: string;
    skills_needed?: string[];
  }) => Promise<void>;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  eventColor,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [joinType, setJoinType] = useState<TeamJoinType>("open");
  const [joinCode, setJoinCode] = useState("");
  const [skillsNeeded, setSkillsNeeded] = useState("");
  const [loading, setLoading] = useState(false);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setJoinCode(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onCreate({
      name,
      description,
      join_type: joinType,
      join_code: joinType === "code" ? joinCode : undefined,
      skills_needed: skillsNeeded ? skillsNeeded.split(",").map(s => s.trim()) : undefined,
    });
    setLoading(false);
  };

  const joinTypeOptions = [
    {
      value: "open" as TeamJoinType,
      label: "Open Team",
      description: "Anyone can join your team freely",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      value: "code" as TeamJoinType,
      label: "Join with Code",
      description: "Members need a code to join your team",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
    {
      value: "invite_only" as TeamJoinType,
      label: "Invite Only",
      description: "Only invited members can join",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 border-b border-gray-100 dark:border-gray-800"
          style={{ background: `linear-gradient(135deg, ${eventColor}10, ${eventColor}05)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Your Team</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Set up your dream team</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              placeholder="e.g., Code Crusaders"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none transition-all"
              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              placeholder="What's your team working on? What makes it special?"
            />
          </div>

          {/* Skills Needed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Skills Needed
            </label>
            <input
              type="text"
              value={skillsNeeded}
              onChange={(e) => setSkillsNeeded(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              placeholder="e.g., React, Python, UI/UX Design"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Separate skills with commas</p>
          </div>

          {/* Team Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Team Privacy
            </label>
            <div className="space-y-2">
              {joinTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setJoinType(option.value);
                    if (option.value === "code" && !joinCode) {
                      generateCode();
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    joinType === option.value
                      ? "border-current bg-opacity-5"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  style={{
                    borderColor: joinType === option.value ? eventColor : undefined,
                    backgroundColor: joinType === option.value ? `${eventColor}08` : undefined,
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      joinType === option.value
                        ? ""
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}
                    style={{
                      backgroundColor: joinType === option.value ? `${eventColor}20` : undefined,
                      color: joinType === option.value ? eventColor : undefined,
                    }}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${joinType === option.value ? "" : "text-gray-900 dark:text-white"}`}
                      style={{ color: joinType === option.value ? eventColor : undefined }}
                    >
                      {option.label}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      joinType === option.value ? "" : "border-gray-300 dark:border-gray-600"
                    }`}
                    style={{ borderColor: joinType === option.value ? eventColor : undefined }}
                  >
                    {joinType === option.value && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: eventColor }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Join Code Input */}
          {joinType === "code" && (
            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Team Join Code
                </label>
                <button
                  type="button"
                  onClick={generateCode}
                  className="text-xs font-medium hover:underline"
                  style={{ color: eventColor }}
                >
                  Generate New
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg tracking-widest text-center focus:outline-none focus:ring-2 uppercase"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="CODE"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(joinCode)}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  title="Copy code"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Share this code with people you want to join your team
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-all shadow-lg"
              style={{
                backgroundColor: eventColor,
                boxShadow: `0 4px 14px ${eventColor}40`
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Team"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
