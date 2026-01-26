"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { AttendeeProvider, useAttendee } from "@/context/AttendeeContext";

// Icons
const Icons = {
  user: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  upload: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  link: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
};

function AttendeePortalContent() {
  const { attendee, team, teamRole, event, token, isLoading, isAuthenticated, logout, refreshSession } = useAttendee();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "teams" | "submissions" | "profile">("dashboard");
  const [teams, setTeams] = useState<Team[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);

  const eventColor = event?.color || "#3B82F6";
  const eventSlug = event?.slug || "";

  // Fetch teams
  const fetchTeams = async () => {
    if (!eventSlug) return;
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/teams`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  // Fetch attendees looking for teams
  const fetchAttendees = async () => {
    if (!eventSlug) return;
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/attendees?looking_for_team=true`);
      const data = await res.json();
      setAttendees(data.attendees || []);
    } catch (error) {
      console.error("Error fetching attendees:", error);
    }
  };

  // Fetch submissions
  const fetchSubmissions = async () => {
    if (!eventSlug || !token) return;
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubmissions(data.submissions || []);

      // Find own submission
      const own = data.submissions?.find((s: Submission) =>
        (s.attendee?.id === attendee?.id) || (s.team?.id === team?.id)
      );
      setMySubmission(own || null);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && event) {
      fetchTeams();
      fetchAttendees();
      fetchSubmissions();
    }
  }, [isAuthenticated, event]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${eventColor} transparent transparent transparent` }} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen eventSlug={eventSlug} eventColor={eventColor} />;
  }

  const requirements = event?.requirements as Record<string, unknown> || {};
  const minTeamSize = (requirements.team_size_min as number) || 1;
  const needsTeam = minTeamSize > 1 && !team;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href={`/event/${eventSlug}`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                {Icons.home}
              </a>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">{event?.title}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Participant Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: eventColor }}>
                  {attendee?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {attendee?.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Logout"
              >
                {Icons.logout}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: Icons.home },
              { id: "teams", label: "Teams", icon: Icons.users },
              { id: "submissions", label: "Submissions", icon: Icons.upload },
              { id: "profile", label: "Profile", icon: Icons.user },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-current text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                style={{ color: activeTab === tab.id ? eventColor : undefined, borderColor: activeTab === tab.id ? eventColor : undefined }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <DashboardTab
            attendee={attendee!}
            team={team}
            teamRole={teamRole}
            mySubmission={mySubmission}
            needsTeam={needsTeam}
            eventColor={eventColor}
            eventSlug={eventSlug}
            requirements={requirements}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "teams" && (
          <TeamsTab
            teams={teams}
            attendees={attendees}
            team={team}
            attendee={attendee!}
            token={token!}
            eventSlug={eventSlug}
            eventColor={eventColor}
            requirements={requirements}
            onRefresh={() => { fetchTeams(); fetchAttendees(); refreshSession(); }}
          />
        )}
        {activeTab === "submissions" && (
          <SubmissionsTab
            submissions={submissions}
            mySubmission={mySubmission}
            team={team}
            attendee={attendee!}
            token={token!}
            eventSlug={eventSlug}
            eventColor={eventColor}
            requirements={requirements}
            onRefresh={fetchSubmissions}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab attendee={attendee!} eventColor={eventColor} />
        )}
      </main>
    </div>
  );
}

// Types
interface Team {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  max_members: number;
  is_open: boolean;
  looking_for_members: boolean;
  skills_needed?: string[];
  members?: { id: string; role: string; attendee: { id: string; name: string; avatar_url?: string; skills?: string[] } }[];
  memberCount?: number;
}

interface Attendee {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  skills?: string[];
  bio?: string;
  company?: string;
  job_title?: string;
  looking_for_team?: boolean;
}

interface Submission {
  id: string;
  title: string;
  description?: string;
  project_url?: string;
  demo_url?: string;
  video_url?: string;
  technologies?: string[];
  status: string;
  submitted_at?: string;
  team?: { id: string; name: string; logo_url?: string };
  attendee?: { id: string; name: string; avatar_url?: string };
}

// Auth Screen Component
function AuthScreen({ eventSlug, eventColor }: { eventSlug: string; eventColor: string }) {
  const { login, register } = useAttendee();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    company: "",
    skills: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "login") {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setError(result.error || "Login failed");
      }
    } else {
      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : [],
        bio: formData.bio || undefined,
      });
      if (!result.success) {
        setError(result.error || "Registration failed");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${eventColor}15` }}>
              <svg className="w-8 h-8" style={{ color: eventColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === "login" ? "Welcome Back" : "Join the Event"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {mode === "login" ? "Sign in to access your dashboard" : "Create your participant account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                placeholder="Min 6 characters"
              />
            </div>

            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                      style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                      style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                    style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                    placeholder="React, Python, Design..."
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 text-white font-semibold rounded-xl transition-all disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: eventColor }}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-sm hover:underline"
              style={{ color: eventColor }}
            >
              {mode === "login" ? "Don't have an account? Register" : "Already registered? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({
  attendee, team, teamRole, mySubmission, needsTeam, eventColor, eventSlug, requirements, onNavigate
}: {
  attendee: Attendee;
  team: Team | null;
  teamRole: string | null;
  mySubmission: Submission | null;
  needsTeam: boolean;
  eventColor: string;
  eventSlug: string;
  requirements: Record<string, unknown>;
  onNavigate: (tab: "dashboard" | "teams" | "submissions" | "profile") => void;
}) {
  const submissionDeadline = requirements.submission_deadline as string;
  const isDeadlinePassed = submissionDeadline && new Date(submissionDeadline) < new Date();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: eventColor }}>
              {attendee.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{attendee.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{attendee.email}</p>
            </div>
          </div>
          {attendee.skills && attendee.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attendee.skills.slice(0, 4).map((skill, i) => (
                <span key={i} className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Team Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
              {Icons.users}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Team Status</h3>
          </div>
          {team ? (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{team.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">Role: {teamRole}</p>
            </div>
          ) : needsTeam ? (
            <div>
              <p className="text-amber-600 dark:text-amber-400 text-sm mb-3">You need to join or create a team</p>
              <button
                onClick={() => onNavigate("teams")}
                className="text-sm font-medium hover:underline"
                style={{ color: eventColor }}
              >
                Browse Teams →
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Solo participation</p>
          )}
        </div>

        {/* Submission Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
              {Icons.upload}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Submission</h3>
          </div>
          {mySubmission ? (
            <div>
              <p className="font-medium text-gray-900 dark:text-white truncate">{mySubmission.title}</p>
              <p className={`text-sm capitalize ${mySubmission.status === 'submitted' ? 'text-green-600' : 'text-amber-600'}`}>
                {mySubmission.status}
              </p>
            </div>
          ) : (
            <div>
              {isDeadlinePassed ? (
                <p className="text-red-600 dark:text-red-400 text-sm">Deadline passed</p>
              ) : needsTeam ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Join a team first</p>
              ) : (
                <>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No submission yet</p>
                  <button
                    onClick={() => onNavigate("submissions")}
                    className="text-sm font-medium hover:underline"
                    style={{ color: eventColor }}
                  >
                    Create Submission →
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate("teams")}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
              {Icons.users}
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">Browse Teams</p>
          </button>
          <button
            onClick={() => onNavigate("submissions")}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
              {Icons.upload}
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">Submissions</p>
          </button>
          <button
            onClick={() => onNavigate("profile")}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
              {Icons.user}
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">Edit Profile</p>
          </button>
          <a
            href={`/event/${eventSlug}`}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left block"
          >
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
              {Icons.home}
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">Event Page</p>
          </a>
        </div>
      </div>
    </div>
  );
}

// Teams Tab
function TeamsTab({
  teams, attendees, team: myTeam, attendee, token, eventSlug, eventColor, requirements, onRefresh
}: {
  teams: Team[];
  attendees: Attendee[];
  team: Team | null;
  attendee: Attendee;
  token: string;
  eventSlug: string;
  eventColor: string;
  requirements: Record<string, unknown>;
  onRefresh: () => void;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const maxTeamSize = (requirements.team_size_max as number) || 5;

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

  const handleCreateTeam = async (name: string, description: string) => {
    try {
      const res = await fetch(`/api/events/public/${eventSlug}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, max_members: maxTeamSize }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create team");
      }
    } catch {
      alert("Failed to create team");
    }
  };

  return (
    <div className="space-y-6">
      {/* My Team Section */}
      {myTeam && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2" style={{ borderColor: eventColor }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Your Team</h3>
            <button
              onClick={handleLeaveTeam}
              disabled={loading === myTeam.id}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Leave Team
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: eventColor }}>
              {myTeam.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{myTeam.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{myTeam.description || "No description"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Team / Browse Teams */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          {myTeam ? "Other Teams" : "Find a Team"}
        </h3>
        {!myTeam && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors hover:opacity-90"
            style={{ backgroundColor: eventColor }}
          >
            {Icons.plus}
            Create Team
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.filter(t => t.id !== myTeam?.id).map((team) => (
          <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: eventColor }}>
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{team.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{team.memberCount || 0}/{team.max_members} members</p>
                </div>
              </div>
              {team.is_open && (team.memberCount || 0) < team.max_members && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Open
                </span>
              )}
            </div>
            {team.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{team.description}</p>
            )}
            {!myTeam && team.is_open && (team.memberCount || 0) < team.max_members && (
              <button
                onClick={() => handleJoinTeam(team.id)}
                disabled={loading === team.id}
                className="w-full py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
              >
                {loading === team.id ? "Joining..." : "Join Team"}
              </button>
            )}
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${eventColor}15` }}>
            {Icons.users}
          </div>
          <p className="text-gray-500 dark:text-gray-400">No teams created yet</p>
          {!myTeam && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-sm font-medium hover:underline"
              style={{ color: eventColor }}
            >
              Be the first to create a team
            </button>
          )}
        </div>
      )}

      {/* Attendees Looking for Teams */}
      {attendees.filter(a => a.id !== attendee.id).length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">People Looking for Teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {attendees.filter(a => a.id !== attendee.id).slice(0, 8).map((person) => (
              <div key={person.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: eventColor }}>
                    {person.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{person.name}</p>
                    {person.company && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{person.company}</p>
                    )}
                  </div>
                </div>
                {person.skills && person.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {person.skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
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
    </div>
  );
}

// Create Team Modal
function CreateTeamModal({
  eventColor, onClose, onCreate
}: {
  eventColor: string;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onCreate(name, description);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Team</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              placeholder="Awesome Team"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none"
              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              placeholder="What's your team about?"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
              style={{ backgroundColor: eventColor }}
            >
              {loading ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Submissions Tab
function SubmissionsTab({
  submissions, mySubmission, team, attendee, token, eventSlug, eventColor, requirements, onRefresh
}: {
  submissions: Submission[];
  mySubmission: Submission | null;
  team: Team | null;
  attendee: Attendee;
  token: string;
  eventSlug: string;
  eventColor: string;
  requirements: Record<string, unknown>;
  onRefresh: () => void;
}) {
  const [showEditor, setShowEditor] = useState(false);
  const minTeamSize = (requirements.team_size_min as number) || 1;
  const needsTeam = minTeamSize > 1 && !team;
  const submissionDeadline = requirements.submission_deadline as string;
  const isDeadlinePassed = submissionDeadline && new Date(submissionDeadline) < new Date();

  return (
    <div className="space-y-6">
      {/* My Submission */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Your Submission</h3>
          {mySubmission && mySubmission.status === "draft" && !isDeadlinePassed && (
            <button
              onClick={() => setShowEditor(true)}
              className="text-sm font-medium hover:underline"
              style={{ color: eventColor }}
            >
              Edit
            </button>
          )}
        </div>

        {mySubmission ? (
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: eventColor }}>
                {mySubmission.title.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">{mySubmission.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{mySubmission.description || "No description"}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                mySubmission.status === "submitted" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                mySubmission.status === "winner" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}>
                {mySubmission.status}
              </span>
            </div>
            {mySubmission.technologies && mySubmission.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mySubmission.technologies.map((tech, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${eventColor}15`, color: eventColor }}>
                    {tech}
                  </span>
                ))}
              </div>
            )}
            {mySubmission.project_url && (
              <a href={mySubmission.project_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-3 text-sm hover:underline" style={{ color: eventColor }}>
                {Icons.link} View Project
              </a>
            )}
          </div>
        ) : needsTeam ? (
          <p className="text-gray-500 dark:text-gray-400">Join a team first to create a submission</p>
        ) : isDeadlinePassed ? (
          <p className="text-red-600 dark:text-red-400">Submission deadline has passed</p>
        ) : (
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created a submission yet</p>
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors hover:opacity-90"
              style={{ backgroundColor: eventColor }}
            >
              {Icons.plus}
              Create Submission
            </button>
          </div>
        )}
      </div>

      {/* All Submissions */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">All Submissions</h3>
        {submissions.filter(s => s.status !== "draft").length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.filter(s => s.status !== "draft").map((sub) => (
              <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: eventColor }}>
                    {sub.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{sub.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      by {sub.team?.name || sub.attendee?.name}
                    </p>
                  </div>
                </div>
                {sub.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{sub.description}</p>
                )}
                {sub.project_url && (
                  <a href={sub.project_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: eventColor }}>
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${eventColor}15` }}>
              {Icons.upload}
            </div>
            <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
          </div>
        )}
      </div>

      {/* Submission Editor Modal */}
      {showEditor && (
        <SubmissionEditor
          submission={mySubmission}
          token={token}
          eventSlug={eventSlug}
          eventColor={eventColor}
          onClose={() => setShowEditor(false)}
          onSave={() => { setShowEditor(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// Submission Editor Modal
function SubmissionEditor({
  submission, token, eventSlug, eventColor, onClose, onSave
}: {
  submission: Submission | null;
  token: string;
  eventSlug: string;
  eventColor: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: submission?.title || "",
    description: submission?.description || "",
    project_url: submission?.project_url || "",
    demo_url: submission?.demo_url || "",
    video_url: submission?.video_url || "",
    technologies: submission?.technologies?.join(", ") || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (submit: boolean) => {
    setLoading(true);
    setError("");

    const payload = {
      ...formData,
      technologies: formData.technologies ? formData.technologies.split(",").map(t => t.trim()) : [],
      action: submit ? "submit" : undefined,
    };

    try {
      const url = submission
        ? `/api/events/public/${eventSlug}/submissions/${submission.id}`
        : `/api/events/public/${eventSlug}/submissions`;
      const method = submission ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Failed to save submission");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {submission ? "Edit Submission" : "Create Submission"}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                placeholder="My Awesome Project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                placeholder="Describe your project..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project URL</label>
                <input
                  type="url"
                  value={formData.project_url}
                  onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Demo URL</label>
                <input
                  type="url"
                  value={formData.demo_url}
                  onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video URL (YouTube/Loom)</label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technologies (comma separated)</label>
              <input
                type="text"
                value={formData.technologies}
                onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
                placeholder="React, Node.js, PostgreSQL..."
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl border-2 disabled:opacity-50"
              style={{ borderColor: eventColor, color: eventColor }}
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={loading || !formData.title.trim()}
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
              style={{ backgroundColor: eventColor }}
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Tab
function ProfileTab({ attendee, eventColor }: { attendee: Attendee; eventColor: string }) {
  const { updateProfile } = useAttendee();
  const [formData, setFormData] = useState({
    name: attendee.name || "",
    company: attendee.company || "",
    job_title: attendee.job_title || "",
    bio: attendee.bio || "",
    skills: attendee.skills?.join(", ") || "",
    looking_for_team: attendee.looking_for_team || false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await updateProfile({
      name: formData.name,
      company: formData.company || undefined,
      job_title: formData.job_title || undefined,
      bio: formData.bio || undefined,
      skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : [],
      looking_for_team: formData.looking_for_team,
    });

    if (result.success) {
      setMessage("Profile updated successfully!");
    } else {
      setMessage(result.error || "Failed to update profile");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-6">Edit Profile</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              placeholder="React, Python, Design..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none"
              style={{ "--tw-ring-color": eventColor } as React.CSSProperties}
              placeholder="Tell others about yourself..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, looking_for_team: !formData.looking_for_team })}
              className={`relative h-6 w-10 rounded-full transition-colors ${
                formData.looking_for_team ? "" : "bg-gray-300 dark:bg-gray-600"
              }`}
              style={{ backgroundColor: formData.looking_for_team ? eventColor : undefined }}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.looking_for_team ? "translate-x-4" : ""}`} />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">I'm looking for a team</span>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm ${message.includes("success") ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-medium rounded-xl disabled:opacity-50 hover:opacity-90 transition-colors"
            style={{ backgroundColor: eventColor }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Main Page Component with Provider
export default function AttendeePortalPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <AttendeeProvider eventSlug={slug}>
      <AttendeePortalContent />
    </AttendeeProvider>
  );
}
