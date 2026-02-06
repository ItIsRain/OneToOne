"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

// ─── Types ───────────────────────────────────────────────────────────

interface OnboardingStep {
  title: string;
  description?: string;
  type: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  steps: OnboardingStep[];
  is_default: boolean;
  created_at: string;
}

const STEP_TYPES = [
  { value: "email", label: "Email" },
  { value: "form", label: "Form / Questionnaire" },
  { value: "contract", label: "Contract / NDA" },
  { value: "meeting", label: "Meeting / Call" },
  { value: "access", label: "Portal / Access Setup" },
  { value: "task", label: "Internal Task" },
  { value: "other", label: "Other" },
];

// ─── Component ───────────────────────────────────────────────────────

export default function OnboardingTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    { title: "", description: "", type: "email" },
  ]);

  const fetchTemplates = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await fetch("/api/onboarding/templates");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load templates");
      }
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName("");
    setDescription("");
    setIsDefault(false);
    setSteps([{ title: "", description: "", type: "email" }]);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description || "");
    setIsDefault(template.is_default);
    setSteps(
      template.steps.map((s) => ({
        title: s.title,
        description: s.description || "",
        type: s.type,
      }))
    );
    setError("");
    setModalOpen(true);
  };

  const addStep = () => {
    setSteps([...steps, { title: "", description: "", type: "task" }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof OnboardingStep, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSteps(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) {
      setError("At least one step with a title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        is_default: isDefault,
        steps: validSteps.map((s) => ({
          title: s.title.trim(),
          description: s.description?.trim() || undefined,
          type: s.type,
        })),
      };

      const url = editingTemplate
        ? `/api/onboarding/templates/${editingTemplate.id}`
        : "/api/onboarding/templates";

      const res = await fetch(url, {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template? Existing onboardings using it will not be affected.")) return;

    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/onboarding/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteLoading(null);
    }
  };

  const inputClass =
    "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

  return (
    <ProtectedPage permission={PERMISSIONS.CRM_VIEW}>
    <FeatureGate feature="crm">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Onboarding Templates
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create reusable step sequences for client onboarding flows
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Template
          </button>
        </div>

        {/* Templates list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 animate-pulse">
                <div className="h-5 w-40 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
                <div className="h-3 w-64 bg-gray-50 dark:bg-gray-800/50 rounded" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-800 dark:bg-error-900/20">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20">
              <svg className="h-6 w-6 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-error-700 dark:text-error-400 mb-3">{fetchError}</p>
            <button
              onClick={fetchTemplates}
              className="inline-flex items-center gap-2 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Retry
            </button>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
              <svg className="h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              No onboarding templates yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
              Create a template to define the steps for onboarding new clients. Templates can be reused across all clients.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Create your first template
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      {template.is_default && (
                        <Badge size="sm" color="primary">Default</Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                    )}
                    {/* Steps preview */}
                    <div className="flex flex-wrap gap-2">
                      {template.steps.map((step, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            {i + 1}
                          </span>
                          {step.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(template)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                      title="Edit"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      disabled={deleteLoading === template.id}
                      className="rounded-lg p-2 text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        className="max-w-2xl p-6 lg:p-8"
      >
        <div className="mb-5">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingTemplate ? "Edit Template" : "New Onboarding Template"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define the steps clients go through during onboarding
          </p>
        </div>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Client Onboarding"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this onboarding flow"
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Set as default template</span>
          </label>

          {/* Steps editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Steps <span className="text-error-500">*</span>
              </label>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Step
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  {/* Step number and reorder */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Step fields */}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateStep(index, "title", e.target.value)}
                        placeholder="Step title"
                        className={`${inputClass} flex-1`}
                      />
                      <select
                        value={step.type}
                        onChange={(e) => updateStep(index, "type", e.target.value)}
                        className={`${inputClass} w-40`}
                      >
                        {STEP_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={step.description || ""}
                      onChange={(e) => updateStep(index, "description", e.target.value)}
                      placeholder="Brief description (optional)"
                      className={`${inputClass} text-xs`}
                    />
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 1}
                    className="shrink-0 self-start rounded p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10 transition-colors disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
          </button>
        </div>
      </Modal>
    </FeatureGate>
    </ProtectedPage>
  );
}
