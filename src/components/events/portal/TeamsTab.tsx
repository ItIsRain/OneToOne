"use client";

import React, { useState } from "react";
import { PortalIcons } from "./PortalIcons";
import { CreateTeamModal } from "./CreateTeamModal";
import type { Team, Attendee, TeamJoinType } from "./types";

interface TeamsTabProps {
  teams: Team[];
  attendees: Attendee[];
  team: Team | null;
  attendee: Attendee;
  token: string;
  eventSlug: string;
  eventColor: string;
  requirements: Record<string, unknown>;
  onRefresh: () => void;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({
  teams,
  attendees,
  team: myTeam,
  attendee,
  token,
  eventSlug,
  eventColor,
  requirements,
  onRefresh,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [teamSettings, setTeamSettings] = useState({
    join_type: (myTeam?.join_type || "open") as TeamJoinType,
    join_code: myTeam?.join_code || "",
  });
  const [copiedCode, setCopiedCode] = useState(false);

  // Check if current user is team leader (must be active member)
  const isTeamLeader = myTeam?.members?.some(
    (m) => m.attendee?.id === attendee.id && m.role === "leader" && (!m.status || m.status === "active")
  );

  // Reset settings when myTeam changes
  React.useEffect(() => {
    if (myTeam) {
      setTeamSettings({
        join_type: (myTeam.join_type || "open") as TeamJoinType,
        join_code: myTeam.join_code || "",
      });
    }
  }, [myTeam]);

  const maxTeamSize = (requirements.team_size_max as number) || 5;
  const minTeamSize = (requirements.team_size_min as number) || 1;
  const isSoloEvent = minTeamSize === 1 && maxTeamSize === 1;

  const handleJoinTeam = async (teamId: string) => {
    setLoading(teamId);
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/teams/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "join" }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to join team");
      }
    } catch {
      alert("Failed to join team");
    }
    setLoading(null);
  };

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return;

    setLoading("join-code");
    setJoinError("");
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/teams/join-with-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: joinCode.toUpperCase() }),
      });
      if (res.ok) {
        setShowJoinCodeModal(false);
        setJoinCode("");
        onRefresh();
      } else {
        const data = await res.json();
        setJoinError(data.error || "Invalid code or team not found");
      }
    } catch {
      setJoinError("Failed to join team");
    }
    setLoading(null);
  };

  const handleLeaveTeam = async () => {
    if (!myTeam) return;
    if (!confirm("Are you sure you want to leave this team?")) return;

    setLoading(myTeam.id);
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/teams/${myTeam.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "leave" }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to leave team");
      }
    } catch {
      alert("Failed to leave team");
    }
    setLoading(null);
  };

  const handleCreateTeam = async (data: {
    name: string;
    description: string;
    join_type: TeamJoinType;
    join_code?: string;
    skills_needed?: string[];
  }) => {
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...data,
          max_members: maxTeamSize,
          is_open: data.join_type === "open",
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        onRefresh();
      } else {
        const responseData = await res.json();
        alert(responseData.error || "Failed to create team");
      }
    } catch {
      alert("Failed to create team");
    }
  };

  const generateJoinCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTeamSettings({ ...teamSettings, join_code: code });
  };

  const handleSaveSettings = async () => {
    if (!myTeam) return;

    // Validate join code if type is 'code'
    if (teamSettings.join_type === "code" && (!teamSettings.join_code || teamSettings.join_code.length < 4)) {
      setSettingsError("Join code must be at least 4 characters");
      return;
    }

    setLoading("save-settings");
    setSettingsError("");
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/teams/${myTeam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          join_type: teamSettings.join_type,
          join_code: teamSettings.join_type === "code" ? teamSettings.join_code.toUpperCase() : null,
          is_open: teamSettings.join_type === "open",
        }),
      });
      if (res.ok) {
        setShowSettingsModal(false);
        onRefresh();
      } else {
        const data = await res.json();
        setSettingsError(data.error || "Failed to save settings");
      }
    } catch {
      setSettingsError("Failed to save settings");
    }
    setLoading(null);
  };

  const copyJoinCode = () => {
    if (myTeam?.join_code) {
      navigator.clipboard.writeText(myTeam.join_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getJoinTypeBadge = (team: Team) => {
    const joinType = team.join_type || (team.is_open ? "open" : "invite_only");
    const configs = {
      open: { label: "Open", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      code: { label: "Code Required", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
      invite_only: { label: "Invite Only", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    };
    return configs[joinType] || configs.open;
  };

  return (
    <div className="space-y-8">
      {/* My Team Section - Premium Card */}
      {myTeam && (
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{ background: `radial-gradient(circle, ${eventColor}, transparent)` }} />

          <div className="relative p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eventColor}20`, color: eventColor }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Team</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You're part of an awesome team</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isTeamLeader && !isSoloEvent && (
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: eventColor }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                )}
                <button
                  onClick={handleLeaveTeam}
                  disabled={loading === myTeam.id}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Leave Team
                </button>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg" style={{ backgroundColor: eventColor }}>
                {myTeam.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{myTeam.name}</h4>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getJoinTypeBadge(myTeam).color}`}>
                    {getJoinTypeBadge(myTeam).label}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{myTeam.description || "No description"}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                    {myTeam.memberCount || 0}/{myTeam.max_members} members
                  </span>
                </div>
              </div>
            </div>

            {/* Join Code Display for Leaders */}
            {isTeamLeader && myTeam.join_code && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider">Team Join Code</p>
                      <p className="text-2xl font-mono font-bold text-amber-900 dark:text-amber-200 tracking-widest">{myTeam.join_code}</p>
                    </div>
                  </div>
                  <button
                    onClick={copyJoinCode}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Share this code with others so they can join your team</p>
              </div>
            )}

            {/* Team Members */}
            {myTeam.members && myTeam.members.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Team Members</h5>
                <div className="flex flex-wrap gap-3">
                  {myTeam.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: eventColor }}>
                        {member.attendee.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{member.attendee.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions Bar */}
      {!myTeam && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            style={{ backgroundColor: eventColor, boxShadow: `0 4px 14px ${eventColor}40` }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your Team
          </button>
          <button
            onClick={() => setShowJoinCodeModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
            style={{ borderColor: eventColor, color: eventColor }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Join with Code
          </button>
        </div>
      )}

      {/* Browse Teams Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {myTeam ? "Other Teams" : "Browse Teams"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {teams.filter(t => t.id !== myTeam?.id).length} teams available
            </p>
          </div>
        </div>

        {/* Teams Grid */}
        {teams.filter(t => t.id !== myTeam?.id).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.filter(t => t.id !== myTeam?.id).map((team) => {
              const badge = getJoinTypeBadge(team);
              const isFull = (team.memberCount || 0) >= team.max_members;
              const canJoin = !myTeam && !isFull && (team.join_type === "open" || team.is_open);

              return (
                <div
                  key={team.id}
                  className="group bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-lg overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: eventColor }}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{team.name}</h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className={`text-sm ${isFull ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                            {team.memberCount || 0}/{team.max_members} {isFull ? "(Full)" : "members"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {team.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">{team.description}</p>
                    )}

                    {/* Skills Needed */}
                    {team.skills_needed && team.skills_needed.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Looking for:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {team.skills_needed.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              {skill}
                            </span>
                          ))}
                          {team.skills_needed.length > 3 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                              +{team.skills_needed.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  {!myTeam && (
                    <div className="px-5 pb-5">
                      {canJoin ? (
                        <button
                          onClick={() => handleJoinTeam(team.id)}
                          disabled={loading === team.id}
                          className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all"
                          style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                        >
                          {loading === team.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Joining...
                            </span>
                          ) : (
                            "Join Team"
                          )}
                        </button>
                      ) : isFull ? (
                        <div className="py-2.5 text-center text-sm text-gray-400 dark:text-gray-500">Team is full</div>
                      ) : team.join_type === "code" ? (
                        <button
                          onClick={() => setShowJoinCodeModal(true)}
                          className="w-full py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          Enter Join Code
                        </button>
                      ) : (
                        <div className="py-2.5 text-center text-sm text-gray-400 dark:text-gray-500">Invite only</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No teams yet</h4>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Be the first to create a team and start building something amazing!</p>
            {!myTeam && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: eventColor, boxShadow: `0 4px 14px ${eventColor}40` }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Team
              </button>
            )}
          </div>
        )}
      </div>

      {/* People Looking for Teams */}
      {!myTeam && attendees.filter(a => a.id !== attendee.id && a.looking_for_team).length > 0 && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">People Looking for Teams</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect with others who want to team up</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {attendees.filter(a => a.id !== attendee.id && a.looking_for_team).slice(0, 8).map((person) => (
              <div
                key={person.id}
                className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold shadow-md"
                    style={{ backgroundColor: eventColor }}
                  >
                    {person.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{person.name}</p>
                    {person.company && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{person.company}</p>
                    )}
                  </div>
                </div>
                {person.skills && person.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {person.skills.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          eventColor={eventColor}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTeam}
        />
      )}

      {/* Join with Code Modal */}
      {showJoinCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJoinCodeModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Join with Code</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enter the team's join code</p>
              </div>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError("");
                }}
                maxLength={8}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-2xl tracking-widest text-center focus:outline-none focus:ring-2 uppercase"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                placeholder="ENTER CODE"
                autoFocus
              />
              {joinError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{joinError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinCodeModal(false)}
                className="flex-1 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinWithCode}
                disabled={loading === "join-code" || !joinCode.trim()}
                className="flex-1 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-all shadow-lg"
                style={{ backgroundColor: eventColor, boxShadow: `0 4px 14px ${eventColor}40` }}
              >
                {loading === "join-code" ? "Joining..." : "Join Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Settings Modal */}
      {showSettingsModal && myTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className="px-6 py-5 border-b border-gray-100 dark:border-gray-800"
              style={{ background: `linear-gradient(135deg, ${eventColor}10, ${eventColor}05)` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${eventColor}20`, color: eventColor }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage how others can join your team</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Join Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Team Access
                </label>
                <div className="space-y-3">
                  {/* Open */}
                  <button
                    type="button"
                    onClick={() => setTeamSettings({ ...teamSettings, join_type: "open" })}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      teamSettings.join_type === "open"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      teamSettings.join_type === "open"
                        ? "bg-green-100 dark:bg-green-900/40 text-green-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${teamSettings.join_type === "open" ? "text-green-700 dark:text-green-300" : "text-gray-900 dark:text-white"}`}>
                        Open to Everyone
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Anyone can join your team directly without any restrictions
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      teamSettings.join_type === "open" ? "border-green-500" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {teamSettings.join_type === "open" && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                    </div>
                  </button>

                  {/* Code Required */}
                  <button
                    type="button"
                    onClick={() => setTeamSettings({ ...teamSettings, join_type: "code" })}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      teamSettings.join_type === "code"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      teamSettings.join_type === "code"
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${teamSettings.join_type === "code" ? "text-amber-700 dark:text-amber-300" : "text-gray-900 dark:text-white"}`}>
                        Require Join Code
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Members need a secret code to join your team
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      teamSettings.join_type === "code" ? "border-amber-500" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {teamSettings.join_type === "code" && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                    </div>
                  </button>

                  {/* Invite Only */}
                  <button
                    type="button"
                    onClick={() => setTeamSettings({ ...teamSettings, join_type: "invite_only" })}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      teamSettings.join_type === "invite_only"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      teamSettings.join_type === "invite_only"
                        ? "bg-red-100 dark:bg-red-900/40 text-red-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${teamSettings.join_type === "invite_only" ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"}`}>
                        Invite Only (Locked)
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Team is closed - no one can join without a direct invite
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      teamSettings.join_type === "invite_only" ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {teamSettings.join_type === "invite_only" && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Join Code Input (shown when code type is selected) */}
              {teamSettings.join_type === "code" && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <label className="block text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                    Team Join Code
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={teamSettings.join_code}
                      onChange={(e) => setTeamSettings({ ...teamSettings, join_code: e.target.value.toUpperCase() })}
                      maxLength={8}
                      className="flex-1 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                      placeholder="ENTER CODE"
                    />
                    <button
                      type="button"
                      onClick={generateJoinCode}
                      className="px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Share this code with people you want to join your team
                  </p>
                </div>
              )}

              {/* Error */}
              {settingsError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {settingsError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading === "save-settings"}
                className="flex-1 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-all shadow-lg"
                style={{ backgroundColor: eventColor, boxShadow: `0 4px 14px ${eventColor}40` }}
              >
                {loading === "save-settings" ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
