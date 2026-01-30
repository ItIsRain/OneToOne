"use client";
import React, { useState, useEffect } from "react";
import {
  DetailsSidebar,
  InfoRow,
  Section,
  StatsGrid,
  StatItem,
} from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Form } from "@/components/agency/FormsTable";

export interface FormSubmissionFull {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  submitter_email: string | null;
  submitter_name: string | null;
  is_read: boolean;
  created_at: string;
}

interface FormDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form | null;
  onEdit?: (form: Form) => void;
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
  onViewSubmission?: (submission: FormSubmissionFull, form: Form) => void;
}

interface Submission {
  id: string;
  submitter_email: string | null;
  submitter_name: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusColor(
  status: string
): "success" | "warning" | "error" | "light" | "primary" {
  switch (status) {
    case "draft":
      return "light";
    case "published":
      return "success";
    case "closed":
      return "warning";
    case "archived":
      return "error";
    default:
      return "primary";
  }
}

export const FormDetailsSidebar: React.FC<FormDetailsSidebarProps> = ({
  isOpen,
  onClose,
  form,
  onEdit,
  onDelete,
  onUpdate,
  onViewSubmission,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    if (!form?.id || !isOpen) {
      setSubmissions([]);
      return;
    }

    const fetchSubmissions = async () => {
      setLoadingSubmissions(true);
      try {
        const res = await fetch(`/api/forms/${form.id}/submissions`);
        if (res.ok) {
          const data = await res.json();
          setSubmissions((data.submissions || []).slice(0, 5));
        }
      } catch {
        // Silently fail for submissions fetch
      } finally {
        setLoadingSubmissions(false);
      }
    };

    fetchSubmissions();
  }, [form?.id, isOpen]);

  if (!form) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(form.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/form/${form.slug}`;
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert("Failed to copy link");
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to duplicate form");
      }
      onUpdate?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate form");
    } finally {
      setIsDuplicating(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit?.(form)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <svg
            className="h-5 w-5"
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
        </button>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={form.title}
      subtitle={`Created ${formatDate(form.created_at)}`}
      headerActions={headerActions}
      footer={
        <div className="flex items-center justify-between">
          <Badge size="sm" color={getStatusColor(form.status)}>
            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
          </Badge>
          <a
            href={`/dashboard/forms/${form.id}/submissions`}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            View Submissions
          </a>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={3}>
            <StatItem
              label="Submissions"
              value={form.submissions_count || 0}
            />
            <StatItem label="Fields" value={form.fields.length} />
            <StatItem
              label="Status"
              value={
                <Badge size="sm" color={getStatusColor(form.status)}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </Badge>
              }
            />
          </StatsGrid>
        </div>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <div className="space-y-2">
            <button
              onClick={() => {
                window.location.href = `/dashboard/forms/${form.id}`;
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Form
            </button>
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
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
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              {copySuccess ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => {
                window.location.href = `/dashboard/forms/${form.id}/submissions`;
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              View Submissions
            </button>
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </button>
          </div>
        </Section>

        {/* Form Details */}
        <Section title="Form Details" collapsible defaultOpen={true}>
          <InfoRow
            label="Description"
            value={form.description || "-"}
          />
          <InfoRow label="Slug" value={form.slug} />
          <InfoRow label="Created" value={formatDate(form.created_at)} />
          <InfoRow label="Updated" value={formatDate(form.updated_at)} />
        </Section>

        {/* Settings */}
        <Section title="Settings" collapsible defaultOpen={false}>
          <InfoRow
            label="Submit Button Text"
            value={form.settings?.submit_button_text || "Submit"}
          />
          <InfoRow
            label="Auto-create Lead"
            value={form.auto_create_lead ? "Yes" : "No"}
          />
          <InfoRow
            label="Auto-create Contact"
            value={form.auto_create_contact ? "Yes" : "No"}
          />
        </Section>

        {/* Recent Submissions */}
        <Section title="Recent Submissions" collapsible defaultOpen={true}>
          {loadingSubmissions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              No submissions yet
            </p>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  onClick={() => {
                    if (onViewSubmission && form) {
                      onViewSubmission(
                        {
                          id: submission.id,
                          form_id: form.id,
                          data: submission.data,
                          submitter_email: submission.submitter_email,
                          submitter_name: submission.submitter_name,
                          is_read: submission.is_read,
                          created_at: submission.created_at,
                        },
                        form
                      );
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                      {submission.submitter_email || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(submission.created_at)}
                    </p>
                  </div>
                  <Badge
                    size="sm"
                    color={!submission.is_read ? "primary" : "light"}
                  >
                    {!submission.is_read ? "New" : "Read"}
                  </Badge>
                </button>
              ))}
              <a
                href={`/dashboard/forms/${form.id}/submissions`}
                className="mt-2 inline-flex items-center text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
              >
                View All Submissions
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          )}
        </Section>
      </div>
    </DetailsSidebar>
  );
};

export default FormDetailsSidebar;
