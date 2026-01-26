"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";

interface Judge {
  id: string;
  email: string;
  name: string | null;
  status: "pending" | "active" | "completed";
  invited_at: string;
  last_accessed_at: string | null;
  scores_submitted?: number;
}

interface JudgingStats {
  total_submissions: number;
  total_judges: number;
  total_scores: number;
  active_judges: number;
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
  const [loading, setLoading] = useState(true);
  const [showConfirmStart, setShowConfirmStart] = useState(false);
  const [newJudgeEmail, setNewJudgeEmail] = useState("");
  const [newJudgeName, setNewJudgeName] = useState("");
  const [addingJudge, setAddingJudge] = useState(false);
  const [activeTab, setActiveTab] = useState<"judges" | "results">("judges");
  const [error, setError] = useState<string | null>(null);

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
        alert(data.error || "Failed to start judging");
      }
    } catch (err) {
      console.error("Error starting judging:", err);
      alert("Failed to start judging");
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

        // Show the judging URL for manual sharing
        if (data.judgingUrl) {
          const copyLink = confirm(
            `Judge added successfully!\n\n${data.emailSent ? "An invitation email was sent." : "Email delivery may be delayed."}\n\nWould you like to copy the judging link to share manually?`
          );
          if (copyLink) {
            navigator.clipboard.writeText(data.judgingUrl);
            alert("Link copied to clipboard!");
          }
        }
      } else {
        alert(data.error || "Failed to add judge");
      }
    } catch (err) {
      console.error("Error adding judge:", err);
      alert("Failed to add judge");
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
        alert(data.error || "Failed to remove judge");
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
        alert("Invitation resent!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to resend invitation");
      }
    } catch (err) {
      console.error("Error resending invite:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    );
  }

  // Error state
  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
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
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Start Judging Period?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This will <span className="font-medium text-gray-900 dark:text-white">lock all submissions</span> and prevent participants from making further entries or edits.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmStart(false)}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartJudging}
              className="flex-1 py-2.5 px-4 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
            >
              Start Judging
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Judging Panel
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {eventTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Badge & Action */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            {judgingStatus === "not_started" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Not Started
              </span>
            )}
            {judgingStatus === "in_progress" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                In Progress
              </span>
            )}
            {judgingStatus === "completed" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Completed
              </span>
            )}
          </div>
          {judgingStatus === "not_started" && (
            <button
              onClick={() => setShowConfirmStart(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Judging
            </button>
          )}
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_submissions}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Submissions</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_judges}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Judges</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.active_judges}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total_scores}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scores</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setActiveTab("judges")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === "judges"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Judges
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
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
      <div className="p-5 max-h-[50vh] overflow-y-auto">
        {activeTab === "judges" && (
          <div className="space-y-5">
            {/* Add Judge Form */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Add Judge
              </h4>
              <form onSubmit={handleAddJudge} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newJudgeEmail}
                    onChange={(e) => setNewJudgeEmail(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={newJudgeName}
                    onChange={(e) => setNewJudgeName(e.target.value)}
                    className="w-32 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={addingJudge || !newJudgeEmail.trim()}
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingJudge ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Judges will receive an email with a secure link to the judging dashboard.
                </p>
              </form>
            </div>

            {/* Judges List */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Judges ({judges.length})
              </h4>
              {judges.length === 0 ? (
                <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No judges added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {judges.map((judge) => (
                    <div
                      key={judge.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-600 dark:text-brand-400 font-medium text-sm">
                            {(judge.name || judge.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {judge.name || judge.email}
                          </p>
                          {judge.name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {judge.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            judge.status === "active"
                              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : judge.status === "completed"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                          }`}
                        >
                          {judge.status === "active" ? "Active" : judge.status === "completed" ? "Done" : "Pending"}
                        </span>
                        {judge.status === "pending" && (
                          <button
                            onClick={() => handleResendInvite(judge.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Resend invitation"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveJudge(judge.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Remove judge"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
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
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!results || !results.submissions || results.submissions.length === 0) {
    return (
      <div className="text-center py-10">
        <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">No submissions to show</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Results appear once judging begins</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.submissions.map((submission: any) => (
        <div
          key={submission.id}
          className={`p-3 rounded-lg border-2 ${
            submission.rank === 1
              ? "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-600"
              : submission.rank === 2
              ? "border-gray-300 bg-gray-50/50 dark:bg-gray-800/50 dark:border-gray-500"
              : submission.rank === 3
              ? "border-orange-300 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-600"
              : "border-gray-100 dark:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  submission.rank === 1
                    ? "bg-amber-400 text-amber-900"
                    : submission.rank === 2
                    ? "bg-gray-300 text-gray-700 dark:bg-gray-500 dark:text-gray-100"
                    : submission.rank === 3
                    ? "bg-orange-400 text-orange-900"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {submission.rank}
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  {submission.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {submission.team?.name || submission.attendee?.name || "Individual"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {submission.average_score > 0 ? submission.average_score.toFixed(1) : "-"}
              </p>
              <p className="text-xs text-gray-400">
                {submission.scores_received}/{results.total_judges} judges
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default JudgingModal;
