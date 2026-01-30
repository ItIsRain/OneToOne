"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FormFieldPalette } from "./FormFieldPalette";
import { FormFieldEditor } from "./FormFieldEditor";
import { FormPreview } from "./FormPreview";
import type { FormField } from "./FormsTable";

interface FormTemplateEditorProps {
  templateId?: string;
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
    nps: "NPS Score",
    scale: "Scale",
    testimonial: "Testimonial",
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
    validation: type === "rating" ? { maxStars: 5 } : {},
    description: "",
    width: "full",
  };
};

export const FormTemplateEditor: React.FC<FormTemplateEditorProps> = ({
  templateId,
}) => {
  const router = useRouter();
  const isNew = !templateId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(
    null
  );
  const [previewMode, setPreviewMode] = useState(false);

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/templates/${templateId}`);
      if (res.ok) {
        const data = await res.json();
        const t = data.template;
        setName(t.name || "");
        setDescription(t.description || "");
        setCategory(t.category || "");
        setFields(t.fields || []);
      } else {
        setError("Failed to load template");
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      setError("Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        fields,
      };

      const url = isNew
        ? "/api/forms/templates"
        : `/api/forms/templates/${templateId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/dashboard/forms/templates");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save template");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      setError("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = (type: string) => {
    const newField = createDefaultField(type);
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    setSelectedFieldIndex(updatedFields.length - 1);
  };

  const handleFieldChange = (index: number, updatedField: FormField) => {
    const updatedFields = [...fields];
    updatedFields[index] = updatedField;
    setFields(updatedFields);
  };

  const handleDeleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    setSelectedFieldIndex(null);
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updatedFields = [...fields];
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[newIndex];
    updatedFields[newIndex] = temp;
    setFields(updatedFields);
    setSelectedFieldIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !isNew && !name) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-8 text-center dark:border-error-800 dark:bg-error-900/20">
        <p className="text-error-600 dark:text-error-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03] rounded-t-xl">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/forms/templates"
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
          <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {isNew ? "New Form Template" : "Edit Form Template"}
          </span>
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
            onClick={() => router.push("/dashboard/forms/templates")}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isNew
                ? "Create Template"
                : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-900/20 dark:text-error-400">
          {error}
        </div>
      )}

      {previewMode ? (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
          <FormPreview fields={fields} title={name} description={description} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Field Palette */}
          <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Template Details */}
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Template Details
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Template name"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Feedback, Contact"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <FormFieldPalette onAddField={handleAddField} />
            </div>
          </div>

          {/* Center: Field List */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
            <div className="mx-auto max-w-2xl">
              {fields.length === 0 ? (
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
                    Click a field type in the palette to add it to your template.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      onClick={() => setSelectedFieldIndex(index)}
                      className={`group flex items-center gap-3 rounded-xl border bg-white p-4 cursor-pointer transition dark:bg-gray-800 ${
                        selectedFieldIndex === index
                          ? "border-brand-500 ring-1 ring-brand-500 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
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
                          disabled={index === fields.length - 1}
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
            selectedFieldIndex < fields.length ? (
              <FormFieldEditor
                field={fields[selectedFieldIndex]}
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
    </div>
  );
};

export default FormTemplateEditor;
