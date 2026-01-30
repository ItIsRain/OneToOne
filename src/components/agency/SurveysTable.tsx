"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  survey_type: "post_event" | "nps" | "satisfaction" | "general_feedback";
  status: "draft" | "active" | "closed" | "archived";
  form_id: string;
  event_id: string | null;
  auto_send_on_event_end: boolean;
  send_delay_minutes: number;
  is_testimonial_enabled: boolean;
  sent_count: number;
  response_count: number;
  form_title: string | null;
  form_slug: string | null;
  event_title: string | null;
  event_status: string | null;
  event_end_date: string | null;
  submissions_count: number;
  created_at: string;
  updated_at: string;
}

interface EventOption {
  id: string;
  title: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "light";
    case "active":
      return "success";
    case "closed":
      return "error";
    case "archived":
      return "light";
    default:
      return "primary";
  }
};

const getSurveyTypeBadgeClasses = (type: string) => {
  switch (type) {
    case "post_event":
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    case "nps":
      return "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
    case "satisfaction":
      return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "general_feedback":
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
  }
};

const getSurveyTypeLabel = (type: string) => {
  switch (type) {
    case "post_event":
      return "Post-Event";
    case "nps":
      return "NPS";
    case "satisfaction":
      return "Satisfaction";
    case "general_feedback":
      return "General";
    default:
      return type;
  }
};

const STATUS_TABS = ["all", "active", "draft", "closed"] as const;

const SURVEY_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "post_event", label: "Post-Event Feedback" },
  { value: "nps", label: "NPS Survey" },
  { value: "satisfaction", label: "Satisfaction Survey" },
  { value: "general_feedback", label: "General Feedback" },
];

export const SurveysTable: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  // Create modal state
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSurveyType, setCreateSurveyType] = useState<string>("post_event");
  const [createEventId, setCreateEventId] = useState("");
  const [createAutoSend, setCreateAutoSend] = useState(false);
  const [createSendDelay, setCreateSendDelay] = useState(30);
  const [createTestimonial, setCreateTestimonial] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await fetch("/api/surveys");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch surveys");
      }

      setSurveys(data.surveys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch surveys");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        // Events API returns array directly or { events: [...] }
        const list = Array.isArray(data) ? data : data.events ?? [];
        setEvents(list);
      }
    } catch {
      // Events are optional, silently fail
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchEvents();
      setCreateTitle("");
      setCreateDescription("");
      setCreateSurveyType("post_event");
      setCreateEventId("");
      setCreateAutoSend(false);
      setCreateSendDelay(30);
      setCreateTestimonial(false);
      setCreateError("");
    }
  }, [isCreateModalOpen, fetchEvents]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionId(null);
    if (openActionId) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openActionId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createTitle.trim()) {
      setCreateError("Title is required");
      return;
    }

    setIsSaving(true);
    setCreateError("");

    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle.trim(),
          description: createDescription.trim() || null,
          survey_type: createSurveyType,
          event_id: createEventId || null,
          auto_send_on_event_end: createAutoSend,
          send_delay_minutes: createAutoSend ? createSendDelay : 0,
          is_testimonial_enabled: createTestimonial,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create survey");
      }

      setSurveys([data.survey, ...surveys]);
      setIsCreateModalOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create survey");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendSurvey = async (id: string) => {
    setSendingId(id);
    try {
      const res = await fetch(`/api/surveys/${id}/send`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send survey");
      }

      await fetchSurveys();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send survey");
    } finally {
      setSendingId(null);
    }
  };

  const handleCloseSurvey = async (id: string) => {
    setClosingId(id);
    try {
      const res = await fetch(`/api/surveys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to close survey");
      }

      setSurveys(
        surveys.map((s) => (s.id === id ? { ...s, status: "closed" as const } : s))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to close survey");
    } finally {
      setClosingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this survey? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/surveys/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete survey");
      }

      setSurveys(surveys.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete survey");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredSurveys = surveys.filter((s) => {
    if (activeTab !== "all" && s.status !== activeTab) return false;
    if (typeFilter && s.survey_type !== typeFilter) return false;
    return true;
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchSurveys}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Surveys
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {surveys.length} {surveys.length === 1 ? "survey" : "surveys"} total
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Survey
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-brand-500 text-brand-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            {SURVEY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {filteredSurveys.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No surveys yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first survey to collect feedback.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Create Survey
            </button>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Title
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Linked Event
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Responses
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Auto-send
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Created
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredSurveys.map((survey) => {
                  const responseRate =
                    survey.sent_count > 0
                      ? Math.round((survey.response_count / survey.sent_count) * 100)
                      : 0;

                  return (
                    <TableRow
                      key={survey.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/dashboard/surveys/${survey.id}`}
                            className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400"
                          >
                            {survey.title}
                          </a>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getSurveyTypeBadgeClasses(
                              survey.survey_type
                            )}`}
                          >
                            {getSurveyTypeLabel(survey.survey_type)}
                          </span>
                        </div>
                        {survey.description && (
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400 truncate max-w-xs">
                            {survey.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {survey.event_title ? (
                          <span className="text-gray-800 dark:text-white/90">
                            {survey.event_title}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          size="sm"
                          color={
                            getStatusColor(survey.status) as
                              | "success"
                              | "warning"
                              | "error"
                              | "light"
                              | "primary"
                          }
                        >
                          {survey.status.charAt(0).toUpperCase() +
                            survey.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-800 text-theme-sm dark:text-white/90">
                            {survey.response_count} / {survey.sent_count}
                          </span>
                          <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all"
                              style={{ width: `${responseRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {survey.auto_send_on_event_end ? (
                          <svg
                            className="w-5 h-5 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatDate(survey.created_at)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(
                                openActionId === survey.id ? null : survey.id
                              );
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Actions
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {openActionId === survey.id && (
                            <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                              <a
                                href={`/dashboard/surveys/${survey.id}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                View Analytics
                              </a>
                              <a
                                href={`/dashboard/forms/${survey.form_id}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                Edit
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionId(null);
                                  handleSendSurvey(survey.id);
                                }}
                                disabled={sendingId === survey.id}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                              >
                                {sendingId === survey.id ? "Sending..." : "Send Survey"}
                              </button>
                              {survey.status !== "closed" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionId(null);
                                    handleCloseSurvey(survey.id);
                                  }}
                                  disabled={closingId === survey.id}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                  {closingId === survey.id
                                    ? "Closing..."
                                    : "Close Survey"}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionId(null);
                                  handleDelete(survey.id);
                                }}
                                disabled={deletingId === survey.id}
                                className="block w-full text-left px-4 py-2 text-sm text-error-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                              >
                                {deletingId === survey.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Survey Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="max-w-md p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Create New Survey
        </h2>

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Survey Title <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="e.g. Post-Event Feedback Survey"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Survey Type
            </label>
            <select
              value={createSurveyType}
              onChange={(e) => setCreateSurveyType(e.target.value)}
              className={inputClass}
            >
              <option value="post_event">Post-Event Feedback</option>
              <option value="nps">NPS Survey</option>
              <option value="satisfaction">Satisfaction Survey</option>
              <option value="general_feedback">General Feedback</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Linked Event
            </label>
            <select
              value={createEventId}
              onChange={(e) => setCreateEventId(e.target.value)}
              className={inputClass}
            >
              <option value="">No event linked</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Briefly describe the purpose of this survey"
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-send on event end
            </label>
            <button
              type="button"
              onClick={() => setCreateAutoSend(!createAutoSend)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                createAutoSend
                  ? "bg-brand-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  createAutoSend ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {createAutoSend && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Send delay (minutes)
              </label>
              <input
                type="number"
                value={createSendDelay}
                onChange={(e) => setCreateSendDelay(Number(e.target.value))}
                min={0}
                className={inputClass}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable testimonial collection
            </label>
            <button
              type="button"
              onClick={() => setCreateTestimonial(!createTestimonial)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                createTestimonial
                  ? "bg-brand-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  createTestimonial ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
            >
              {isSaving ? "Creating..." : "Create Survey"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
