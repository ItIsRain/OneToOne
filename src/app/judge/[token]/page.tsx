"use client";

import React, { useState, useEffect, useCallback } from "react";
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
      // Initialize with default scores
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

      // Refresh data
      await fetchData();
      setSelectedSubmission(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit score");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = data?.submissions.filter((s) => {
    if (filter === "pending") return !s.myScore;
    if (filter === "scored") return !!s.myScore;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading judging dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { judge, event, judgingCriteria, stats } = data;

  if (event.judging_status === "not_started") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Judging Not Started</h1>
          <p className="text-gray-600 dark:text-gray-400">
            The judging period for <strong>{event.title}</strong> hasn&apos;t started yet. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  if (event.judging_status === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Judging Completed</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for judging <strong>{event.title}</strong>! The judging period has ended.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            You scored {stats.scored} out of {stats.total} submissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome, {judge.name || judge.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scored}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Scored</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-600">{stats.total}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Judging Criteria */}
        {judgingCriteria.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Judging Criteria</h3>
            <div className="flex flex-wrap gap-2">
              {judgingCriteria.map((criterion, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                >
                  {criterion.key}: <strong>{criterion.value}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "scored"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-brand-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {f === "all" ? "All Submissions" : f === "pending" ? `Pending (${stats.pending})` : `Scored (${stats.scored})`}
            </button>
          ))}
        </div>

        {/* Submissions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubmissions?.map((submission) => (
            <div
              key={submission.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
                submission.myScore
                  ? "border-green-200 dark:border-green-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600"
              }`}
              onClick={() => handleSelectSubmission(submission)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {submission.team?.logo_url || submission.attendee?.avatar_url ? (
                    <img
                      src={submission.team?.logo_url || submission.attendee?.avatar_url || ""}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-brand-600 dark:text-brand-400 font-semibold">
                        {(submission.team?.name || submission.attendee?.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {submission.team?.name || submission.attendee?.name || "Individual"}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {submission.myScore && (
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                    {submission.myScore.total_score.toFixed(1)}
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{submission.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {submission.description}
              </p>

              {submission.technologies && submission.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {submission.technologies.slice(0, 3).map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                    >
                      {tech}
                    </span>
                  ))}
                  {submission.technologies.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-gray-500">
                      +{submission.technologies.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredSubmissions?.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No submissions found</p>
          </div>
        )}
      </main>

      {/* Scoring Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSubmission.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  by {selectedSubmission.team?.name || selectedSubmission.attendee?.name || "Individual"}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Project Description */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Project Description</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                  {selectedSubmission.description}
                </p>
              </div>

              {/* Links */}
              {(selectedSubmission.project_url || selectedSubmission.demo_url || selectedSubmission.video_url) && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.project_url && (
                      <a
                        href={selectedSubmission.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-sm text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50"
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
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
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Screenshots</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSubmission.screenshots.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
                      >
                        <img
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          className="w-full h-auto object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Attached Files</h4>
                  <div className="space-y-3">
                    {selectedSubmission.files.map((file) => {
                      const ext = file.file_name.split(".").pop()?.toLowerCase() || "";
                      const isImage = file.file_type?.startsWith("image/") ||
                        ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
                      const isPdf = file.file_type === "application/pdf" || ext === "pdf";

                      if (isImage) {
                        return (
                          <a
                            key={file.id}
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
                          >
                            <img
                              src={file.file_url}
                              alt={file.file_name}
                              className="w-full h-auto object-cover"
                            />
                            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{file.file_name}</div>
                          </a>
                        );
                      }

                      if (isPdf) {
                        return (
                          <div key={file.id} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <iframe
                              src={file.file_url}
                              title={file.file_name}
                              className="w-full h-[400px] bg-white"
                            />
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{file.file_name}</span>
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                              >
                                Open in new tab
                              </a>
                            </div>
                          </div>
                        );
                      }

                      // Determine icon and label by file type
                      const fileTypeInfo: Record<string, { label: string; color: string }> = {
                        doc: { label: "DOC", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
                        docx: { label: "DOCX", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
                        xls: { label: "XLS", color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" },
                        xlsx: { label: "XLSX", color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" },
                        ppt: { label: "PPT", color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30" },
                        pptx: { label: "PPTX", color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30" },
                        zip: { label: "ZIP", color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30" },
                        rar: { label: "RAR", color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30" },
                        "7z": { label: "7Z", color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30" },
                        txt: { label: "TXT", color: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700" },
                        csv: { label: "CSV", color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" },
                      };
                      const info = fileTypeInfo[ext] || { label: ext.toUpperCase() || "FILE", color: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700" };

                      return (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${info.color}`}>
                            {info.label}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{file.file_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to download</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Technologies */}
              {selectedSubmission.technologies && selectedSubmission.technologies.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scoring */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your Scores</h4>
                <div className="space-y-4">
                  {judgingCriteria.map((criterion) => (
                    <div key={criterion.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          {criterion.key}
                          {criterion.value && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              ({criterion.value})
                            </span>
                          )}
                        </label>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {scores[criterion.key] || 0}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={scores[criterion.key] || 0}
                        onChange={(e) => handleScoreChange(criterion.key, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                      />
                    </div>
                  ))}

                  {judgingCriteria.length === 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">Overall Score</label>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {scores["overall"] || 0}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={scores["overall"] || 0}
                        onChange={(e) => handleScoreChange("overall", parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                      />
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div className="mt-6">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Add constructive feedback for the team..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
