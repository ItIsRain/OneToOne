"use client";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";

interface JudgeScore {
  submission_id: string;
  submission_title: string;
  total_score: number;
  scored_at: string;
}

interface Judge {
  id: string;
  email: string;
  name: string | null;
  status: "pending" | "active" | "completed";
  invited_at: string;
  last_accessed_at: string | null;
  scores_submitted: number;
  scores: JudgeScore[];
  average_score: number;
  completion_percent: number;
}

interface JudgingStats {
  total_submissions: number;
  total_judges: number;
  total_scores: number;
  active_judges: number;
}

interface CurrentUser {
  email: string;
  isJudge: boolean;
  judgingUrl: string | null;
}

interface JudgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventType: string;
}

export const JudgingModal: React.FC<JudgingModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}) => {
  const [judgingStatus, setJudgingStatus] = useState<"not_started" | "in_progress" | "completed">("not_started");
  const [judges, setJudges] = useState<Judge[]>([]);
  const [stats, setStats] = useState<JudgingStats | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmStart, setShowConfirmStart] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [newJudgeEmail, setNewJudgeEmail] = useState("");
  const [newJudgeName, setNewJudgeName] = useState("");
  const [addingJudge, setAddingJudge] = useState(false);
  const [activeTab, setActiveTab] = useState<"judges" | "results">("judges");
  const [error, setError] = useState<string | null>(null);
  const [expandedJudge, setExpandedJudge] = useState<string | null>(null);

  const fetchJudgingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/events/${eventId}/judging`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load judging data");
        return;
      }

      setJudgingStatus(data.judging_status || "not_started");
      setJudges(data.judges || []);
      setStats(data.stats || null);
      setCurrentUser(data.currentUser || null);
    } catch (err) {
      console.error("Error fetching judging data:", err);
      setError("Failed to load judging data");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) {
      fetchJudgingData();
    }
  }, [isOpen, fetchJudgingData]);

  const handleStartJudging = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/judging`, {
        method: "POST",
      });
      if (response.ok) {
        setShowConfirmStart(false);
        await fetchJudgingData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to start judging");
      }
    } catch (err) {
      console.error("Error starting judging:", err);
      toast.error("Failed to start judging");
    }
  };

  const handleEndJudging = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/judging`, {
        method: "PATCH",
      });
      if (response.ok) {
        setShowConfirmEnd(false);
        setActiveTab("results");
        await fetchJudgingData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to end judging");
      }
    } catch (err) {
      console.error("Error ending judging:", err);
      toast.error("Failed to end judging");
    }
  };

  const handleOpenJudgingPortal = () => {
    if (currentUser?.judgingUrl) {
      window.open(currentUser.judgingUrl, "_blank");
    }
  };

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeEmail.trim()) return;

    setAddingJudge(true);
    try {
      const response = await fetch(`/api/events/${eventId}/judging/judges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newJudgeEmail.trim(),
          name: newJudgeName.trim() || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setNewJudgeEmail("");
        setNewJudgeName("");
        await fetchJudgingData();

        if (data.judgingUrl) {
          const copyLink = confirm(
            `Judge added successfully!\n\n${data.emailSent ? "An invitation email was sent." : "Email delivery may be delayed."}\n\nWould you like to copy the judging link to share manually?`
          );
          if (copyLink) {
            navigator.clipboard.writeText(data.judgingUrl);
            toast.success("Link copied to clipboard!");
          }
        }
      } else {
        toast.error(data.error || "Failed to add judge");
      }
    } catch (err) {
      console.error("Error adding judge:", err);
      toast.error("Failed to add judge");
    } finally {
      setAddingJudge(false);
    }
  };

  const handleRemoveJudge = async (judgeId: string) => {
    if (!confirm("Remove this judge? Their scores will be deleted.")) return;

    try {
      const response = await fetch(`/api/events/${eventId}/judging/judges/${judgeId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchJudgingData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to remove judge");
      }
    } catch (err) {
      console.error("Error removing judge:", err);
    }
  };

  const handleResendInvite = async (judgeId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/judging/judges/${judgeId}`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Invitation resent!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to resend invitation");
      }
    } catch (err) {
      console.error("Error resending invite:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading judging data...</p>
          </div>
        </div>
      </Modal>
    );
  }

  // Error state
  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  // Confirm Start Judging View
  if (showConfirmStart) {
    return (
      <Modal isOpen={isOpen} onClose={() => setShowConfirmStart(false)} className="max-w-md">
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Start Judging Period?
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            This will <span className="font-medium text-gray-700 dark:text-gray-200">lock all submissions</span> and prevent participants from making further entries or edits.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmStart(false)}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleStartJudging}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/25"
            >
              Start Judging
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Confirm End Judging View
  if (showConfirmEnd) {
    const totalSubmissions = stats?.total_submissions || 0;
    const incompleteJudges = judges.filter(judge => {
      return judge.status === "pending" || judge.scores_submitted < totalSubmissions;
    });
    const pendingJudges = judges.filter(j => j.status === "pending");
    const inProgressJudges = incompleteJudges.filter(j => j.status === "active");

    return (
      <Modal isOpen={isOpen} onClose={() => setShowConfirmEnd(false)} className="max-w-md">
        <div className="p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              End Judging & Announce Winners?
            </h3>
          </div>

          {incompleteJudges.length > 0 && (
            <div className="my-5 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Some judges haven&apos;t finished
                  </p>
                  <div className="mt-1 text-sm text-amber-700 dark:text-amber-400 space-y-0.5">
                    {pendingJudges.length > 0 && (
                      <p>{pendingJudges.length} judge{pendingJudges.length > 1 ? "s" : ""} haven&apos;t started</p>
                    )}
                    {inProgressJudges.length > 0 && (
                      <p>{inProgressJudges.length} judge{inProgressJudges.length > 1 ? "s" : ""} still scoring</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This will finalize all scores. Judges won&apos;t be able to modify scores after this.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmEnd(false)}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleEndJudging}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25"
            >
              {incompleteJudges.length > 0 ? "Announce Anyway" : "Announce Winners"}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Winners View - shown when judging is completed
  if (judgingStatus === "completed") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
        <WinnersDisplay eventId={eventId} eventTitle={eventTitle} onClose={onClose} />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Judging Panel
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {eventTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status & Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {judgingStatus === "not_started" && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Not Started
              </span>
            )}
            {judgingStatus === "in_progress" && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 text-sm font-medium border border-green-200/50 dark:border-green-800/50">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                In Progress
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.isJudge && judgingStatus === "in_progress" && (
              <button
                onClick={handleOpenJudgingPortal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-medium hover:from-purple-600 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/25"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                My Portal
              </button>
            )}
            {judgingStatus === "not_started" && (
              <button
                onClick={() => setShowConfirmStart(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/25"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Judging
              </button>
            )}
            {judgingStatus === "in_progress" && (
              <button
                onClick={() => setShowConfirmEnd(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                End & Announce
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-5">
            <StatCard
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              value={stats.total_submissions}
              label="Submissions"
              color="blue"
            />
            <StatCard
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              value={stats.total_judges}
              label="Judges"
              color="purple"
            />
            <StatCard
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              value={stats.active_judges}
              label="Active"
              color="green"
            />
            <StatCard
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
              value={stats.total_scores}
              label="Scores"
              color="amber"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab("judges")}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === "judges"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Judges
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === "results"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[55vh] overflow-y-auto">
        {activeTab === "judges" && (
          <div className="space-y-6">
            {/* Info Note */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Note:</span> As the event owner, you&apos;re not automatically a judge. Add yourself below if you want to participate in judging.
                </p>
              </div>
            </div>

            {/* Add Judge Form */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 border border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Judge
              </h4>
              <form onSubmit={handleAddJudge} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newJudgeEmail}
                    onChange={(e) => setNewJudgeEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={newJudgeName}
                    onChange={(e) => setNewJudgeName(e.target.value)}
                    className="w-28 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={addingJudge || !newJudgeEmail.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-medium hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
                  >
                    {addingJudge ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Judges receive an email with a secure link to their judging dashboard
                </p>
              </form>
            </div>

            {/* Judges List */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Judges ({judges.length})
              </h4>
              {judges.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No judges added yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add judges above to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {judges.map((judge) => (
                    <JudgeCard
                      key={judge.id}
                      judge={judge}
                      totalSubmissions={stats?.total_submissions || 0}
                      isExpanded={expandedJudge === judge.id}
                      onToggleExpand={() => setExpandedJudge(expandedJudge === judge.id ? null : judge.id)}
                      onResendInvite={() => handleResendInvite(judge.id)}
                      onRemove={() => handleRemoveJudge(judge.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <JudgingResults eventId={eventId} />
        )}
      </div>
    </Modal>
  );
};

// Stat Card Component
function StatCard({
  icon,
  value,
  label,
  color
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "blue" | "purple" | "green" | "amber";
}) {
  const colorClasses = {
    blue: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400",
    purple: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 text-purple-600 dark:text-purple-400",
    green: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400",
    amber: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// Judge Card Component
function JudgeCard({
  judge,
  totalSubmissions,
  isExpanded,
  onToggleExpand,
  onResendInvite,
  onRemove
}: {
  judge: Judge;
  totalSubmissions: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onResendInvite: () => void;
  onRemove: () => void;
}) {
  const progressPercent = judge.completion_percent;
  const hasScores = judge.scores && judge.scores.length > 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with status */}
            <div className="relative">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm ${
                judge.status === "active"
                  ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400"
                  : judge.status === "completed"
                  ? "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400"
                  : "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-400"
              }`}>
                {(judge.name || judge.email).charAt(0).toUpperCase()}
              </div>
              {judge.status === "active" && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {judge.name || judge.email.split("@")[0]}
                </p>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    judge.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : judge.status === "completed"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {judge.status === "active" ? "Scoring" : judge.status === "completed" ? "Done" : "Pending"}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {judge.email}
              </p>
            </div>
          </div>

          {/* Right side - Score + Actions */}
          <div className="flex items-center gap-3">
            {/* Average Score Badge */}
            {judge.scores_submitted > 0 && (
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {judge.average_score}
                </p>
                <p className="text-xs text-gray-400">avg score</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              {judge.status === "pending" && (
                <button
                  onClick={onResendInvite}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  title="Resend invitation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              {hasScores && (
                <button
                  onClick={onToggleExpand}
                  className={`p-2 rounded-lg transition-all ${
                    isExpanded
                      ? "text-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={isExpanded ? "Hide scores" : "Show scores"}
                >
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={onRemove}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Remove judge"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalSubmissions > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {judge.scores_submitted} of {totalSubmissions} scored
              </span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {progressPercent}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent === 100
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : progressPercent > 0
                    ? "bg-gradient-to-r from-brand-500 to-brand-400"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded Scores */}
      {isExpanded && hasScores && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Individual Scores
          </p>
          <div className="space-y-2">
            {judge.scores.map((score) => (
              <div
                key={score.submission_id}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-3">
                  {score.submission_title}
                </p>
                <span className={`px-2.5 py-1 rounded-lg text-sm font-semibold ${
                  score.total_score >= 8
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : score.total_score >= 5
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {score.total_score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Results component
function JudgingResults({ eventId }: { eventId: string }) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/judging/results`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results || !results.submissions || results.submissions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No results yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Results appear once judges submit scores</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.submissions.map((submission: any) => (
        <div
          key={submission.id}
          className={`p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
            submission.rank === 1
              ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-600"
              : submission.rank === 2
              ? "border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 dark:border-gray-500"
              : submission.rank === 3
              ? "border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 dark:border-orange-600"
              : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  submission.rank === 1
                    ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-900 shadow-lg shadow-amber-300/50"
                    : submission.rank === 2
                    ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 dark:from-gray-500 dark:to-gray-600 dark:text-gray-100"
                    : submission.rank === 3
                    ? "bg-gradient-to-br from-orange-400 to-amber-500 text-orange-900 shadow-lg shadow-orange-300/50"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                #{submission.rank}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {submission.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {submission.team?.name || submission.attendee?.name || "Individual"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${
                submission.rank === 1
                  ? "text-amber-600 dark:text-amber-400"
                  : submission.rank === 2
                  ? "text-gray-600 dark:text-gray-300"
                  : submission.rank === 3
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-900 dark:text-white"
              }`}>
                {submission.average_score > 0 ? submission.average_score.toFixed(1) : "-"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {submission.scores_received}/{results.total_judges} judges
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Winners Display component - shown when judging is completed
function WinnersDisplay({
  eventId,
  eventTitle,
  onClose
}: {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/judging/results`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading winners...</p>
        </div>
      </div>
    );
  }

  const winners = results?.submissions?.slice(0, 3) || [];
  const hasWinners = winners.length > 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Event Winners
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {eventTitle}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Completed Badge */}
      <div className="flex justify-center mb-8">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 text-sm font-medium border border-green-200/50 dark:border-green-800/50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Judging Completed
        </span>
      </div>

      {!hasWinners ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No submissions were scored</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Winners */}
          {winners.map((winner: any, index: number) => (
            <div
              key={winner.id}
              className={`relative p-5 rounded-2xl border-2 transition-all hover:scale-[1.01] ${
                index === 0
                  ? "border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/30 dark:via-yellow-900/20 dark:to-orange-900/20 dark:border-amber-500 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20"
                  : index === 1
                  ? "border-gray-300 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-800/80 dark:via-slate-800/50 dark:to-gray-800/80 dark:border-gray-500"
                  : "border-orange-300 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 dark:border-orange-500"
              }`}
            >
              {/* Rank Badge */}
              <div className={`absolute -top-3 -left-3 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                index === 0
                  ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-900"
                  : index === 1
                  ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 dark:from-gray-500 dark:to-gray-600 dark:text-gray-100"
                  : "bg-gradient-to-br from-orange-400 to-amber-500 text-orange-900"
              }`}>
                <span className="text-xl font-bold">{index + 1}</span>
              </div>

              {/* Winner Content */}
              <div className="ml-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-bold ${
                      index === 0 ? "text-xl" : "text-lg"
                    } text-gray-900 dark:text-white`}>
                      {winner.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      by {winner.team?.name || winner.attendee?.name || "Individual"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      index === 0 ? "text-3xl" : "text-2xl"
                    } ${
                      index === 0
                        ? "text-amber-600 dark:text-amber-400"
                        : index === 1
                        ? "text-gray-600 dark:text-gray-300"
                        : "text-orange-600 dark:text-orange-400"
                    }`}>
                      {winner.average_score > 0 ? winner.average_score.toFixed(1) : "-"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      avg score
                    </p>
                  </div>
                </div>

                {/* Place Label */}
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                    index === 0
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200"
                      : index === 1
                      ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      : "bg-orange-100 text-orange-800 dark:bg-orange-800/50 dark:text-orange-200"
                  }`}>
                    {index === 0 ? "1st Place - Winner" : index === 1 ? "2nd Place" : "3rd Place"}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Total Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-center gap-12 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {results?.submissions?.length || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submissions</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {results?.total_judges || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Judges</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Button */}
      <div className="mt-8">
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default JudgingModal;
