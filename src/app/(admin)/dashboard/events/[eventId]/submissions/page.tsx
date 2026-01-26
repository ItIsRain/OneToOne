"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

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

export default function EventSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

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
    } catch (err) {
      console.error("Error updating score:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Submissions" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Draft</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-yellow-600">{stats.winners}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Winners</p>
          </div>
        </div>
      )}

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className={`bg-white dark:bg-gray-800 rounded-xl p-5 border-2 ${
              submission.status === "winner"
                ? "border-yellow-400"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {/* Winner Badge */}
            {submission.status === "winner" && (
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 text-sm font-bold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {submission.winner_place === 1 ? "1st Place" :
                   submission.winner_place === 2 ? "2nd Place" :
                   submission.winner_place === 3 ? "3rd Place" :
                   `${submission.winner_place}th Place`}
                </span>
                {submission.winner_prize && (
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    {submission.winner_prize}
                  </span>
                )}
              </div>
            )}

            {/* Submission Info */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {submission.title.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {submission.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  by {submission.team?.name || submission.attendee?.name}
                </p>
              </div>
            </div>

            {/* Description */}
            {submission.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {submission.description}
              </p>
            )}

            {/* Technologies */}
            {submission.technologies && submission.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {submission.technologies.slice(0, 4).map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Score */}
            {submission.score !== undefined && submission.score !== null && (
              <div className="mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Score: </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {submission.score}/100
                </span>
              </div>
            )}

            {/* Links */}
            <div className="flex gap-2 mb-4">
              {submission.project_url && (
                <a
                  href={submission.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Project
                </a>
              )}
              {submission.demo_url && (
                <a
                  href={submission.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Demo
                </a>
              )}
              {submission.video_url && (
                <a
                  href={submission.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Video
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {submission.status !== "winner" && submission.status !== "draft" && (
                <button
                  onClick={() => {
                    setSelectedSubmission(submission);
                    setShowWinnerModal(true);
                  }}
                  className="flex-1 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg hover:bg-yellow-200"
                >
                  Mark as Winner
                </button>
              )}
              <button
                onClick={() => {
                  const score = prompt("Enter score (0-100):", submission.score?.toString() || "");
                  const notes = prompt("Judge notes:", submission.judge_notes || "");
                  if (score !== null) {
                    handleUpdateScore(submission.id, parseInt(score) || 0, notes || "");
                  }
                }}
                className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Score
              </button>
            </div>
          </div>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
        </div>
      )}

      {/* Winner Modal */}
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
    </div>
  );
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Mark as Winner
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {submission.title} by {submission.team?.name || submission.attendee?.name}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Place
            </label>
            <select
              value={place}
              onChange={(e) => setPlace(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={1}>1st Place</option>
              <option value={2}>2nd Place</option>
              <option value={3}>3rd Place</option>
              <option value={4}>Honorable Mention</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prize (optional)
            </label>
            <input
              type="text"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="$5,000 + AWS Credits"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(submission.id, place, prize)}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-yellow-500 rounded-xl hover:bg-yellow-600"
          >
            Confirm Winner
          </button>
        </div>
      </div>
    </div>
  );
}
