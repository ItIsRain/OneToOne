"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";

interface JudgingCriteria {
  key: string;
  value: string;
  max_score?: number;
}

interface Submission {
  id: string;
  title: string;
  description: string;
  project_url: string | null;
  demo_url: string | null;
  video_url: string | null;
  technologies: string[];
  screenshots: string[] | null;
  submitted_at: string;
  team: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  attendee: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  files: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
  }[];
  myScore: {
    id: string;
    criteria_scores: Record<string, number>;
    feedback: string | null;
    total_score: number;
    scored_at: string;
  } | null;
}

interface JudgeData {
  judge: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
    description: string;
    type: string;
    color: string;
    judging_status: "not_started" | "in_progress" | "completed";
  };
  judgingCriteria: JudgingCriteria[];
  submissions: Submission[];
  stats: {
    total: number;
    scored: number;
    pending: number;
  };
}

// Animated progress ring component
function ProgressRing({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-white/5"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-cyan-400 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: "drop-shadow(0 0 6px rgb(34 211 238 / 0.6))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white font-mono tracking-tight">
          {Math.round(progress)}%
        </span>
        <span className="text-xs text-white/50 uppercase tracking-wider">Complete</span>
      </div>
    </div>
  );
}

// Score dial component for the modal
function ScoreDial({ value, onChange, label, description }: { value: number; onChange: (v: number) => void; label: string; description?: string }) {
  const percentage = (value / 10) * 100;
  const getColor = () => {
    if (value >= 8) return "from-emerald-400 to-cyan-400";
    if (value >= 5) return "from-amber-400 to-orange-400";
    return "from-rose-400 to-pink-400";
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-white">{label}</span>
          {description && (
            <p className="text-xs text-white/40 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-mono font-bold bg-gradient-to-r ${getColor()} bg-clip-text text-transparent`}>
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-white/30">/10</span>
        </div>
      </div>
      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getColor()} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getColor()} rounded-full blur-md opacity-50 transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-white/20 font-mono">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

export default function JudgeDashboard() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<JudgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "scored">("all");

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/judging/${token}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    if (submission.myScore) {
      setScores(submission.myScore.criteria_scores || {});
      setFeedback(submission.myScore.feedback || "");
    } else {
      const defaultScores: Record<string, number> = {};
      data?.judgingCriteria.forEach((c) => {
        defaultScores[c.key] = 0;
      });
      setScores(defaultScores);
      setFeedback("");
    }
  };

  const handleScoreChange = (criteriaKey: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [criteriaKey]: value,
    }));
  };

  const handleSubmitScore = async () => {
    if (!selectedSubmission) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/judging/${token}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          criteriaScores: scores,
          feedback: feedback.trim() || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to submit score");
      }

      await fetchData();
      setSelectedSubmission(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit score");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    return data?.submissions.filter((s) => {
      if (filter === "pending") return !s.myScore;
      if (filter === "scored") return !!s.myScore;
      return true;
    });
  }, [data?.submissions, filter]);

  const totalScore = useMemo(() => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [scores]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-cyan-400/50 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
          </div>
          <p className="text-white/50 text-sm font-medium tracking-wide">Loading judging arena...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/50">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { judge, event, judgingCriteria, stats } = data;
  const progressPercent = stats.total > 0 ? (stats.scored / stats.total) * 100 : 0;

  // Not started state
  if (event.judging_status === "not_started") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Judging Not Started</h1>
          <p className="text-white/50 mb-1">
            The judging period for <span className="text-amber-400 font-medium">{event.title}</span> hasn&apos;t started yet.
          </p>
          <p className="text-white/30 text-sm">Please check back later.</p>
        </div>
      </div>
    );
  }

  // Completed state
  if (event.judging_status === "completed") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Judging Complete</h1>
          <p className="text-white/50 mb-4">
            Thank you for judging <span className="text-emerald-400 font-medium">{event.title}</span>!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="text-white/50 text-sm">You scored</span>
            <span className="text-xl font-bold font-mono text-cyan-400">{stats.scored}</span>
            <span className="text-white/50 text-sm">of</span>
            <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
            <span className="text-white/50 text-sm">submissions</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Event info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">{event.title}</h1>
                <p className="text-sm text-white/40">
                  Welcome back, <span className="text-cyan-400">{judge.name || judge.email}</span>
                </p>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold font-mono text-emerald-400" style={{ textShadow: "0 0 20px rgb(52 211 153 / 0.5)" }}>
                    {stats.scored}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">Scored</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold font-mono text-amber-400" style={{ textShadow: "0 0 20px rgb(251 191 36 / 0.5)" }}>
                    {stats.pending}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold font-mono text-white">
                    {stats.total}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <ProgressRing progress={progressPercent} />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Your Judging Progress</h2>
              <p className="text-white/40 text-sm mb-4">
                {stats.pending > 0
                  ? `You have ${stats.pending} submission${stats.pending > 1 ? 's' : ''} left to review.`
                  : "Great work! You've reviewed all submissions."}
              </p>

              {/* Criteria pills */}
              {judgingCriteria.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-white/30 uppercase tracking-wider mr-2 self-center">Criteria:</span>
                  {judgingCriteria.map((criterion, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60"
                    >
                      {criterion.key}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(["all", "pending", "scored"] as const).map((f) => {
            const count = f === "all" ? stats.total : f === "pending" ? stats.pending : stats.scored;
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${isActive ? "bg-cyan-500/30" : "bg-white/10"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submissions Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubmissions?.map((submission, index) => {
            const isScored = !!submission.myScore;
            return (
              <div
                key={submission.id}
                onClick={() => handleSelectSubmission(submission)}
                className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  isScored
                    ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30"
                    : "bg-white/[0.02] border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.04]"
                } border`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Scored indicator glow */}
                {isScored && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {submission.team?.logo_url || submission.attendee?.avatar_url ? (
                      <img
                        src={submission.team?.logo_url || submission.attendee?.avatar_url || ""}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                        <span className="text-cyan-400 font-bold">
                          {(submission.team?.name || submission.attendee?.name || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-white/80 text-sm">
                        {submission.team?.name || submission.attendee?.name || "Individual"}
                      </h4>
                      <p className="text-[11px] text-white/30">
                        {new Date(submission.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {isScored && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                      <span className="text-lg font-bold font-mono text-emerald-400">
                        {submission.myScore!.total_score.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="font-semibold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                  {submission.title}
                </h3>
                <p className="text-sm text-white/40 line-clamp-2 mb-4">
                  {submission.description}
                </p>

                {/* Technologies */}
                {submission.technologies && submission.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {submission.technologies.slice(0, 3).map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/50"
                      >
                        {tech}
                      </span>
                    ))}
                    {submission.technologies.length > 3 && (
                      <span className="px-2 py-0.5 text-[11px] text-white/30">
                        +{submission.technologies.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Status indicator */}
                <div className="absolute bottom-5 right-5">
                  {isScored ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <svg className="w-4 h-4 text-white/30 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredSubmissions?.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">No submissions found</p>
          </div>
        )}
      </main>

      {/* Scoring Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedSubmission(null)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#12121a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative px-8 py-6 border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {selectedSubmission.team?.logo_url || selectedSubmission.attendee?.avatar_url ? (
                    <img
                      src={selectedSubmission.team?.logo_url || selectedSubmission.attendee?.avatar_url || ""}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                      <span className="text-xl text-cyan-400 font-bold">
                        {(selectedSubmission.team?.name || selectedSubmission.attendee?.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedSubmission.title}</h3>
                    <p className="text-sm text-white/40">
                      by {selectedSubmission.team?.name || selectedSubmission.attendee?.name || "Individual"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10 max-h-[calc(90vh-200px)] overflow-hidden">
              {/* Left: Project details */}
              <div className="flex-1 p-8 overflow-y-auto">
                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-xs uppercase tracking-wider text-white/30 mb-3">Description</h4>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.description}
                  </p>
                </div>

                {/* Links */}
                {(selectedSubmission.project_url || selectedSubmission.demo_url || selectedSubmission.video_url) && (
                  <div className="mb-6">
                    <h4 className="text-xs uppercase tracking-wider text-white/30 mb-3">Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.project_url && (
                        <a
                          href={selectedSubmission.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          Source Code
                        </a>
                      )}
                      {selectedSubmission.demo_url && (
                        <a
                          href={selectedSubmission.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-sm text-cyan-400 hover:bg-cyan-500/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Live Demo
                        </a>
                      )}
                      {selectedSubmission.video_url && (
                        <a
                          href={selectedSubmission.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400 hover:bg-rose-500/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Video
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Screenshots */}
                {selectedSubmission.screenshots && selectedSubmission.screenshots.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs uppercase tracking-wider text-white/30 mb-3">Screenshots</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedSubmission.screenshots.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-colors group"
                        >
                          <img
                            src={url}
                            alt={`Screenshot ${i + 1}`}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs uppercase tracking-wider text-white/30 mb-3">Files</h4>
                    <div className="space-y-2">
                      {selectedSubmission.files.map((file) => {
                        const ext = file.file_name.split(".").pop()?.toLowerCase() || "";
                        const isImage = file.file_type?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

                        if (isImage) {
                          return (
                            <a
                              key={file.id}
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-colors"
                            >
                              <img src={file.file_url} alt={file.file_name} className="w-full h-auto" />
                              <div className="px-3 py-2 bg-white/5 text-xs text-white/50">{file.file_name}</div>
                            </a>
                          );
                        }

                        return (
                          <a
                            key={file.id}
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                              {ext.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/70 truncate">{file.file_name}</p>
                              <p className="text-xs text-white/30">Click to download</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Technologies */}
                {selectedSubmission.technologies && selectedSubmission.technologies.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-white/30 mb-3">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Scoring panel */}
              <div className="lg:w-[400px] p-8 overflow-y-auto bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xs uppercase tracking-wider text-white/30">Your Scores</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/40">Average:</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400" style={{ textShadow: "0 0 20px rgb(34 211 238 / 0.5)" }}>
                      {totalScore.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {judgingCriteria.length > 0 ? (
                    judgingCriteria.map((criterion) => (
                      <ScoreDial
                        key={criterion.key}
                        label={criterion.key}
                        description={criterion.value}
                        value={scores[criterion.key] || 0}
                        onChange={(v) => handleScoreChange(criterion.key, v)}
                      />
                    ))
                  ) : (
                    <ScoreDial
                      label="Overall Score"
                      description="Rate the overall quality of this submission"
                      value={scores["overall"] || 0}
                      onChange={(v) => handleScoreChange("overall", v)}
                    />
                  )}
                </div>

                {/* Feedback */}
                <div className="mt-8">
                  <label className="text-xs uppercase tracking-wider text-white/30 block mb-3">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share constructive feedback with the team..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative px-8 py-5 border-t border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-medium hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {selectedSubmission.myScore ? "Update Score" : "Submit Score"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
