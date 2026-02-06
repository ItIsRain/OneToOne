"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

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
  winner_place?: number;
  winner_prize?: string;
  judge_notes?: string;
  score?: number;
  team?: { id: string; name: string; logo_url?: string };
  attendee?: { id: string; name: string; email: string; avatar_url?: string };
}

interface Stats {
  total: number;
  draft: number;
  submitted: number;
  winners: number;
}

// Stat card component with visual flair
function StatCard({
  value,
  label,
  icon,
  color,
  glowColor,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}) {
  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${glowColor}`}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-4xl font-bold font-mono tracking-tight ${color}`}>
              {value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {label}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/20')} dark:${color.replace('text-', 'bg-').replace('400', '900/30')}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

// Score modal component
function ScoreModal({
  submission,
  onClose,
  onSave,
}: {
  submission: Submission;
  onClose: () => void;
  onSave: (id: string, score: number, notes: string) => void;
}) {
  const [score, setScore] = useState(submission.score || 0);
  const [notes, setNotes] = useState(submission.judge_notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(submission.id, score, notes);
    setSaving(false);
  };

  const getScoreColor = () => {
    if (score >= 80) return "from-emerald-400 to-teal-400";
    if (score >= 60) return "from-cyan-400 to-blue-400";
    if (score >= 40) return "from-amber-400 to-orange-400";
    return "from-rose-400 to-pink-400";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            {submission.team?.logo_url || submission.attendee?.avatar_url ? (
              <img
                src={submission.team?.logo_url || submission.attendee?.avatar_url}
                alt=""
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {submission.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {submission.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                by {submission.team?.name || submission.attendee?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Score display */}
          <div className="text-center py-4">
            <div className="relative inline-block">
              <span
                className={`text-7xl font-bold font-mono bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}
              >
                {score}
              </span>
              <span className="text-2xl text-gray-400 dark:text-gray-500 font-mono ml-1">
                /100
              </span>
            </div>
          </div>

          {/* Score slider */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-2 font-mono">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
            <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getScoreColor()} rounded-full transition-all duration-300`}
                style={{ width: `${score}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Quick score buttons */}
          <div className="flex gap-2 justify-center">
            {[25, 50, 75, 100].map((val) => (
              <button
                key={val}
                onClick={() => setScore(val)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  score === val
                    ? "bg-violet-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Judge Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this submission..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none resize-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Score"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Winner modal component
function WinnerModal({
  submission,
  onClose,
  onSave,
}: {
  submission: Submission;
  onClose: () => void;
  onSave: (id: string, place: number, prize: string) => void;
}) {
  const [place, setPlace] = useState(1);
  const [prize, setPrize] = useState("");
  const [saving, setSaving] = useState(false);

  const places = [
    { value: 1, label: "1st Place", emoji: "🥇", color: "from-amber-400 to-yellow-500" },
    { value: 2, label: "2nd Place", emoji: "🥈", color: "from-gray-300 to-gray-400" },
    { value: 3, label: "3rd Place", emoji: "🥉", color: "from-orange-400 to-amber-500" },
    { value: 4, label: "Honorable Mention", emoji: "⭐", color: "from-violet-400 to-purple-500" },
  ];

  const handleSave = async () => {
    setSaving(true);
    await onSave(submission.id, place, prize);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative px-8 py-6 border-b border-gray-200 dark:border-gray-800 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Mark as Winner
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {submission.title}
          </p>
        </div>

        {/* Content */}
        <div className="relative px-8 py-6 space-y-6">
          {/* Place selection */}
          <div className="grid grid-cols-2 gap-3">
            {places.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlace(p.value)}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                  place === p.value
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-2xl block mb-1">{p.emoji}</span>
                <span
                  className={`text-sm font-medium ${
                    place === p.value
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {p.label}
                </span>
                {place === p.value && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Prize input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prize (optional)
            </label>
            <input
              type="text"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="e.g., $5,000 + AWS Credits"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="relative px-8 py-5 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 font-bold hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span>🏆</span>
                Confirm Winner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventSubmissionsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "draft" | "submitted" | "winner">("all");

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/submissions`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      const data = await response.json();
      setSubmissions(data.submissions || []);
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleMarkWinner = async (submissionId: string, place: number, prize: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "winner",
          winner_place: place,
          winner_prize: prize,
        }),
      });

      if (!response.ok) throw new Error("Failed to update submission");

      await fetchSubmissions();
      setShowWinnerModal(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Error marking winner:", err);
      alert("Failed to mark as winner");
    }
  };

  const handleUpdateScore = async (submissionId: string, score: number, notes: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, judge_notes: notes }),
      });

      if (!response.ok) throw new Error("Failed to update submission");
      await fetchSubmissions();
      setShowScoreModal(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Error updating score:", err);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "winner") return s.status === "winner";
    return s.status === filter;
  });

  const getWinnerBadge = (place: number) => {
    const badges = {
      1: { emoji: "🥇", label: "1st", gradient: "from-amber-400 to-yellow-500", text: "text-amber-900" },
      2: { emoji: "🥈", label: "2nd", gradient: "from-gray-300 to-gray-400", text: "text-gray-700" },
      3: { emoji: "🥉", label: "3rd", gradient: "from-orange-400 to-amber-500", text: "text-orange-900" },
    };
    return badges[place as 1 | 2 | 3] || { emoji: "⭐", label: `${place}th`, gradient: "from-violet-400 to-purple-500", text: "text-violet-900" };
  };

  if (loading) {
    return (
      <ProtectedPage permission={PERMISSIONS.EVENTS_VIEW}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-violet-200 dark:border-violet-800" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading submissions...</p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage permission={PERMISSIONS.EVENTS_VIEW}>
      <PageBreadcrumb pageTitle="Submissions" />

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            value={stats.total}
            label="Total Submissions"
            color="text-gray-900 dark:text-white"
            glowColor="bg-gray-500/20"
            icon={
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          <StatCard
            value={stats.draft}
            label="Drafts"
            color="text-gray-500 dark:text-gray-400"
            glowColor="bg-gray-500/10"
            icon={
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          />
          <StatCard
            value={stats.submitted}
            label="Submitted"
            color="text-emerald-600 dark:text-emerald-400"
            glowColor="bg-emerald-500/20"
            icon={
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            value={stats.winners}
            label="Winners"
            color="text-amber-600 dark:text-amber-400"
            glowColor="bg-amber-500/20"
            icon={
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {(["all", "submitted", "draft", "winner"] as const).map((f) => {
          const counts = {
            all: stats?.total || 0,
            draft: stats?.draft || 0,
            submitted: stats?.submitted || 0,
            winner: stats?.winners || 0,
          };
          const labels = {
            all: "All",
            draft: "Drafts",
            submitted: "Submitted",
            winner: "Winners",
          };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                filter === f
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {labels[f]}
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${filter === f ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredSubmissions.map((submission) => {
          const isWinner = submission.status === "winner";
          const badge = isWinner && submission.winner_place ? getWinnerBadge(submission.winner_place) : null;

          return (
            <div
              key={submission.id}
              className={`group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                isWinner
                  ? "border-amber-300 dark:border-amber-600"
                  : "border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-600"
              }`}
            >
              {/* Winner badge overlay */}
              {isWinner && badge && (
                <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-2xl bg-gradient-to-r ${badge.gradient} ${badge.text} font-bold text-sm flex items-center gap-1.5 z-10`}>
                  <span>{badge.emoji}</span>
                  <span>{badge.label} Place</span>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  {submission.team?.logo_url || submission.attendee?.avatar_url ? (
                    <img
                      src={submission.team?.logo_url || submission.attendee?.avatar_url}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {submission.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {submission.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {submission.team?.name || submission.attendee?.name}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {submission.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                    {submission.description}
                  </p>
                )}

                {/* Technologies */}
                {submission.technologies && submission.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {submission.technologies.slice(0, 4).map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                    {submission.technologies.length > 4 && (
                      <span className="px-2.5 py-1 text-xs text-gray-400">
                        +{submission.technologies.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Score display */}
                {submission.score !== undefined && submission.score !== null && (
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            submission.score >= 80
                              ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                              : submission.score >= 60
                              ? "bg-gradient-to-r from-cyan-400 to-blue-400"
                              : submission.score >= 40
                              ? "bg-gradient-to-r from-amber-400 to-orange-400"
                              : "bg-gradient-to-r from-rose-400 to-pink-400"
                          }`}
                          style={{ width: `${submission.score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                      {submission.score}
                    </span>
                  </div>
                )}

                {/* Links */}
                {(submission.project_url || submission.demo_url || submission.video_url) && (
                  <div className="flex gap-2 mb-4">
                    {submission.project_url && (
                      <a
                        href={submission.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Code
                      </a>
                    )}
                    {submission.demo_url && (
                      <a
                        href={submission.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Demo
                      </a>
                    )}
                    {submission.video_url && (
                      <a
                        href={submission.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Video
                      </a>
                    )}
                  </div>
                )}

                {/* Prize display for winners */}
                {isWinner && submission.winner_prize && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
                    <span className="text-lg">🎁</span>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {submission.winner_prize}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {submission.status !== "winner" && submission.status !== "draft" && (
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setShowWinnerModal(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 text-sm font-bold hover:from-amber-500 hover:to-yellow-600 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>🏆</span>
                      Mark Winner
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowScoreModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Score
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredSubmissions.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No submissions yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Submissions will appear here once participants start submitting their projects.
          </p>
        </div>
      )}

      {/* Modals */}
      {showWinnerModal && selectedSubmission && (
        <WinnerModal
          submission={selectedSubmission}
          onClose={() => {
            setShowWinnerModal(false);
            setSelectedSubmission(null);
          }}
          onSave={handleMarkWinner}
        />
      )}

      {showScoreModal && selectedSubmission && (
        <ScoreModal
          submission={selectedSubmission}
          onClose={() => {
            setShowScoreModal(false);
            setSelectedSubmission(null);
          }}
          onSave={handleUpdateScore}
        />
      )}
    </ProtectedPage>
  );
}
