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
import type { FormField } from "./FormsTable";

interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  submitter_email: string | null;
  is_read: boolean;
  created_at: string;
}

interface FormSubmissionsTableProps {
  formId: string;
}

export const FormSubmissionsTable: React.FC<FormSubmissionsTableProps> = ({
  formId,
}) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] =
    useState<FormSubmission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/forms/${formId}/submissions`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch submissions");
      }

      setSubmissions(data.submissions || []);
      setFields(data.fields || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch submissions"
      );
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/forms/${formId}/submissions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete submission");
      }

      setSubmissions(submissions.filter((s) => s.id !== id));
      if (viewingSubmission?.id === id) {
        setViewingSubmission(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete submission");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      "Email",
      "Submitted",
      "Read",
      ...fields.map((f) => f.label),
    ];

    const rows = submissions.map((sub) => [
      sub.submitter_email || "",
      new Date(sub.created_at).toLocaleString(),
      sub.is_read ? "Yes" : "No",
      ...fields.map((f) => {
        const val = sub.data[f.id];
        if (Array.isArray(val)) return val.join(", ");
        if (val === null || val === undefined) return "";
        return String(val);
      }),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `form-submissions-${formId}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleMarkRead = async (submission: FormSubmission) => {
    try {
      const res = await fetch(
        `/api/forms/${formId}/submissions/${submission.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_read: true }),
        }
      );

      if (res.ok) {
        setSubmissions(
          submissions.map((s) =>
            s.id === submission.id ? { ...s, is_read: true } : s
          )
        );
      }
    } catch {
      // Silently fail for read status
    }
  };

  const handleView = (submission: FormSubmission) => {
    setViewingSubmission(submission);
    if (!submission.is_read) {
      handleMarkRead(submission);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show up to 3 field columns in the table
  const displayFields = fields
    .filter((f) => !["section_heading", "paragraph", "signature"].includes(f.type))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
              />
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
          onClick={fetchSubmissions}
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
              Submissions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {submissions.length}{" "}
              {submissions.length === 1 ? "submission" : "submissions"} total
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {submissions.length === 0 ? (
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No submissions yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Submissions will appear here once people fill out your form.
            </p>
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
                    Email
                  </TableCell>
                  {displayFields.map((field) => (
                    <TableCell
                      key={field.id}
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {field.label}
                    </TableCell>
                  ))}
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Submitted
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
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {submissions.map((submission) => (
                  <TableRow
                    key={submission.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02] ${
                      viewingSubmission?.id === submission.id
                        ? "bg-brand-50 dark:bg-brand-500/10"
                        : ""
                    }`}
                    onClick={() => handleView(submission)}
                  >
                    <TableCell className="py-3">
                      <span
                        className={`text-theme-sm ${
                          submission.is_read
                            ? "text-gray-500 dark:text-gray-400"
                            : "font-medium text-gray-800 dark:text-white/90"
                        }`}
                      >
                        {submission.submitter_email || "-"}
                      </span>
                    </TableCell>
                    {displayFields.map((field) => (
                      <TableCell
                        key={field.id}
                        className="py-3 text-gray-500 text-theme-sm dark:text-gray-400"
                      >
                        <span className="truncate max-w-[200px] block">
                          {(() => {
                            const val = submission.data[field.id];
                            if (Array.isArray(val)) return val.join(", ");
                            if (val === null || val === undefined) return "-";
                            return String(val);
                          })()}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(submission.created_at)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={submission.is_read ? "light" : "primary"}
                      >
                        {submission.is_read ? "Read" : "New"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(submission);
                          }}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(submission.id);
                          }}
                          disabled={deletingId === submission.id}
                          className="text-error-500 hover:text-error-600 disabled:opacity-50"
                        >
                          {deletingId === submission.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      <Modal
        isOpen={!!viewingSubmission}
        onClose={() => setViewingSubmission(null)}
        className="max-w-lg p-6 sm:p-8"
      >
        {viewingSubmission && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Submission Details
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {viewingSubmission.submitter_email || "Anonymous"} &middot;{" "}
                {formatDate(viewingSubmission.created_at)}
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {fields.map((field) => {
                if (["section_heading", "paragraph"].includes(field.type))
                  return null;
                const val = viewingSubmission.data[field.id];
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      {field.label}
                    </label>
                    <div className="text-sm text-gray-800 dark:text-white/90 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 border border-gray-200 dark:border-gray-700">
                      {val === null || val === undefined || val === ""
                        ? <span className="text-gray-400 italic">Not provided</span>
                        : Array.isArray(val)
                        ? val.join(", ")
                        : field.type === "signature" && typeof val === "string"
                        ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={val}
                              alt="Signature"
                              className="max-h-20 rounded"
                            />
                          )
                        : String(val)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => {
                  handleDelete(viewingSubmission.id);
                  setViewingSubmission(null);
                }}
                disabled={deletingId === viewingSubmission.id}
                className="inline-flex items-center gap-2 rounded-lg border border-error-300 px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
              <button
                onClick={() => setViewingSubmission(null)}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
