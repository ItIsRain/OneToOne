"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "../ui/badge/Badge";
import { FormFieldPalette } from "./FormFieldPalette";
import { FormFieldEditor } from "./FormFieldEditor";
import { FormPreview } from "./FormPreview";
import { FormSettingsPanel } from "./FormSettingsPanel";
import type { Form, FormField } from "./FormsTable";

interface FormBuilderProps {
  formId: string;
}

const createDefaultField = (type: string): FormField => {
  const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const labelMap: Record<string, string> = {
    text: "Text Field",
    email: "Email",
    phone: "Phone Number",
    number: "Number",
    textarea: "Text Area",
    select: "Dropdown",
    multi_select: "Multi Select",
    checkbox: "Checkbox",
    radio: "Radio Buttons",
    date: "Date",
    file_upload: "File Upload",
    rating: "Rating",
    signature: "Signature",
    section_heading: "Section Heading",
    paragraph: "Paragraph Text",
  };

  const needsOptions = ["select", "multi_select", "radio", "checkbox"];

  return {
    id,
    type,
    label: labelMap[type] || "Field",
    placeholder: "",
    required: false,
    options: needsOptions.includes(type)
      ? ["Option 1", "Option 2", "Option 3"]
      : [],
    validation:
      type === "rating" ? { maxStars: 5 } : {},
    description: "",
    width: "full",
  };
};

export const FormBuilder: React.FC<FormBuilderProps> = ({ formId }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(
    null
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const fetchForm = useCallback(async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch form");
      }

      setForm(data.form);
      setTitleInput(data.form.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch form");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          fields: form.fields,
          settings: form.settings,
          thank_you_title: form.thank_you_title,
          thank_you_message: form.thank_you_message,
          thank_you_redirect_url: form.thank_you_redirect_url,
          auto_create_lead: form.auto_create_lead,
          auto_create_contact: form.auto_create_contact,
          lead_field_mapping: form.lead_field_mapping,
          conditional_rules: form.conditional_rules,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save form");
      }

      setForm(data.form);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: form.status === "published" ? "draft" : "published",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update form status");
      }

      setForm(data.form);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update form status");
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = (type: string) => {
    if (!form) return;
    const newField = createDefaultField(type);
    const updatedFields = [...form.fields, newField];
    setForm({ ...form, fields: updatedFields });
    setSelectedFieldIndex(updatedFields.length - 1);
  };

  const handleFieldChange = (index: number, updatedField: FormField) => {
    if (!form) return;
    const updatedFields = [...form.fields];
    updatedFields[index] = updatedField;
    setForm({ ...form, fields: updatedFields });
  };

  const handleDeleteField = (index: number) => {
    if (!form) return;
    const updatedFields = form.fields.filter((_, i) => i !== index);
    setForm({ ...form, fields: updatedFields });
    setSelectedFieldIndex(null);
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    if (!form) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.fields.length) return;

    const updatedFields = [...form.fields];
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[newIndex];
    updatedFields[newIndex] = temp;
    setForm({ ...form, fields: updatedFields });
    setSelectedFieldIndex(newIndex);
  };

  const handleTitleSave = () => {
    if (!form) return;
    setForm({ ...form, title: titleInput });
    setEditingTitle(false);
  };

  const handleFormSettingsChange = (updates: Partial<Form>) => {
    if (!form) return;
    setForm({ ...form, ...updates });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading form builder...
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error || "Form not found"}</p>
        <a
          href="/dashboard/forms"
          className="mt-2 text-brand-500 hover:text-brand-600 inline-block"
        >
          Back to Forms
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/forms"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </a>

          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitleInput(form.title);
                    setEditingTitle(false);
                  }
                }}
                autoFocus
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={handleTitleSave}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-lg font-semibold text-gray-800 dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400"
            >
              {form.title}
            </button>
          )}

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
            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              previewMode
                ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={handlePublish}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {form.status === "published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      {previewMode ? (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
          <FormPreview
            fields={form.fields}
            title={form.title}
            description={form.description || undefined}
          />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Field Palette */}
          <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <FormFieldPalette onAddField={handleAddField} />
          </div>

          {/* Center: Field List */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
            <div className="mx-auto max-w-2xl">
              {form.fields.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No fields yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Click a field type in the palette to add it to your form.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.fields.map((field, index) => (
                    <div
                      key={field.id}
                      onClick={() => setSelectedFieldIndex(index)}
                      className={`group flex items-center gap-3 rounded-xl border bg-white p-4 cursor-pointer transition dark:bg-gray-800 ${
                        selectedFieldIndex === index
                          ? "border-brand-500 ring-1 ring-brand-500 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      {/* Move buttons */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveField(index, "up");
                          }}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveField(index, "down");
                          }}
                          disabled={index === form.fields.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <svg
                            className="w-4 h-4"
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
                      </div>

                      {/* Field info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                            {field.label}
                          </span>
                          {field.required && (
                            <span className="text-error-500 text-xs">*</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {field.type.replace(/_/g, " ")} &middot;{" "}
                          {field.width === "half" ? "Half width" : "Full width"}
                        </span>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteField(index);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-error-500 transition"
                      >
                        <svg
                          className="w-4 h-4"
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Field Editor */}
          <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            {selectedFieldIndex !== null &&
            selectedFieldIndex < form.fields.length ? (
              <FormFieldEditor
                field={form.fields[selectedFieldIndex]}
                onChange={(updatedField) =>
                  handleFieldChange(selectedFieldIndex, updatedField)
                }
                onDelete={() => handleDeleteField(selectedFieldIndex)}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select a field to edit its properties.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <FormSettingsPanel
          form={form}
          onChange={handleFormSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
