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
import { CreateFormModal } from "./modals/CreateFormModal";
import { FormEmbedModal } from "./modals/FormEmbedModal";
import { FormDetailsSidebar } from "./sidebars/FormDetailsSidebar";
import type { FormSubmissionFull } from "./sidebars/FormDetailsSidebar";

export interface Form {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "draft" | "published" | "closed" | "archived";
  fields: FormField[];
  submissions_count: number;
  settings: FormSettings | null;
  thank_you_title: string | null;
  thank_you_message: string | null;
  thank_you_redirect_url: string | null;
  auto_create_lead: boolean;
  auto_create_contact: boolean;
  lead_field_mapping: Record<string, string> | null;
  conditional_rules: ConditionalRule[] | null;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  validation: Record<string, unknown>;
  description: string;
  width: "full" | "half";
}

export interface FormSettings {
  submit_button_text?: string;
  show_progress_bar?: boolean;
  allow_multiple_submissions?: boolean;
}

export interface ConditionalRule {
  field_id: string;
  operator: "equals" | "not_equals" | "contains" | "not_empty" | "empty";
  value: string;
  target_field_id: string;
  action: "show" | "hide";
}

export interface PublicForm {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  fields: FormField[];
  settings: FormSettings | null;
  thank_you_title: string | null;
  thank_you_message: string | null;
  thank_you_redirect_url: string | null;
  conditional_rules: ConditionalRule[] | null;
}

const getStatusColor = (status: string) => {
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
};

export const FormsTable = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [embedModalSlug, setEmbedModalSlug] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [viewingForm, setViewingForm] = useState<Form | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<{
    submission: FormSubmissionFull;
    form: Form;
  } | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      const res = await fetch("/api/forms");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch forms");
      }

      setForms(data.forms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCopyLink = async (slug: string) => {
    try {
      const url = `${window.location.origin}/form/${slug}`;
      await navigator.clipboard.writeText(url);
      alert("Form link copied to clipboard!");
    } catch {
      alert("Failed to copy link");
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/forms/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to duplicate form");
      }

      setForms([data.form, ...forms]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate form");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this form?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete form");
      }

      setForms(forms.filter((f) => f.id !== id));
      if (viewingForm?.id === id) setViewingForm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete form");
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewSubmission = async (submission: FormSubmissionFull, form: Form) => {
    setViewingForm(null);
    setViewingSubmission({ submission, form });

    // Mark as read
    if (!submission.is_read) {
      try {
        await fetch(`/api/forms/${form.id}/submissions/${submission.id}`, {
          method: "GET",
        });
      } catch {
        // Silently fail
      }
    }
  };

  const handleFormCreated = (form: Form) => {
    setForms([form, ...forms]);
    setIsCreateModalOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          onClick={fetchForms}
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
              Forms
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {forms.length} {forms.length === 1 ? "form" : "forms"} total
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
              Create Form
            </button>
          </div>
        </div>

        {forms.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No forms yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first form.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Create Form
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
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Submissions
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
                {forms.map((form) => (
                  <TableRow
                    key={form.id}
                    onClick={() => setViewingForm(form)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02] ${viewingForm?.id === form.id ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}
                  >
                    <TableCell className="py-3">
                      <a
                        href={`/dashboard/forms/${form.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400"
                      >
                        {form.title}
                      </a>
                      {form.description && (
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400 truncate max-w-xs">
                          {form.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={
                          getStatusColor(form.status) as
                            | "success"
                            | "warning"
                            | "error"
                            | "light"
                            | "primary"
                        }
                      >
                        {form.status.charAt(0).toUpperCase() +
                          form.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {form.submissions_count || 0}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(form.created_at)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/dashboard/forms/${form.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Edit
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyLink(form.slug); }}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEmbedModalSlug(form.slug); }}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Embed
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDuplicate(form.id); }}
                          disabled={duplicatingId === form.id}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                        >
                          {duplicatingId === form.id ? "..." : "Duplicate"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(form.id); }}
                          disabled={deletingId === form.id}
                          className="text-error-500 hover:text-error-600 disabled:opacity-50"
                        >
                          {deletingId === form.id ? "..." : "Delete"}
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

      <CreateFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleFormCreated}
      />

      <FormEmbedModal
        isOpen={!!embedModalSlug}
        onClose={() => setEmbedModalSlug(null)}
        formSlug={embedModalSlug || ""}
      />

      <FormDetailsSidebar
        isOpen={!!viewingForm}
        onClose={() => setViewingForm(null)}
        form={viewingForm}
        onDelete={(id) => { handleDelete(id); setViewingForm(null); }}
        onUpdate={fetchForms}
        onViewSubmission={handleViewSubmission}
      />

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
                {viewingSubmission.submission.submitter_email || "Anonymous"} &middot;{" "}
                {new Date(viewingSubmission.submission.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {viewingSubmission.form.fields.map((field) => {
                if (["section_heading", "paragraph"].includes(field.type)) return null;
                const val = viewingSubmission.submission.data[field.id];
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

            <div className="mt-6 flex justify-end">
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
