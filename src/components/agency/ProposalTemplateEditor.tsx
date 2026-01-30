"use client";
import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import { ProposalSectionEditor } from "@/components/agency/ProposalSectionEditor";
import type { ProposalSection } from "@/components/agency/ProposalSectionEditor";

interface ProposalTemplateEditorProps {
  templateId?: string; // undefined = creating new
}

const sectionTypes = [
  { type: "cover", label: "Cover Page" },
  { type: "introduction", label: "Introduction" },
  { type: "scope", label: "Scope of Work" },
  { type: "timeline", label: "Timeline" },
  { type: "pricing", label: "Pricing" },
  { type: "terms", label: "Terms & Conditions" },
  { type: "signature", label: "Signature" },
  { type: "custom", label: "Custom Section" },
];

export const ProposalTemplateEditor: React.FC<ProposalTemplateEditorProps> = ({
  templateId,
}) => {
  const isNew = !templateId;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/templates/${templateId}`);
      if (res.ok) {
        const data = await res.json();
        const t = data.template;
        setName(t.name || "");
        setDescription(t.description || "");
        setSections(t.sections || []);
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
        sections,
      };

      const url = isNew
        ? "/api/proposals/templates"
        : `/api/proposals/templates/${templateId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        window.location.href = "/dashboard/proposals/templates";
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

  const handleSectionChange = (index: number, updated: ProposalSection) => {
    const newSections = [...sections];
    newSections[index] = updated;
    setSections(newSections);
  };

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [
      newSections[index],
      newSections[index - 1],
    ];
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [
      newSections[index + 1],
      newSections[index],
    ];
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
  };

  const handleAddSection = (type: string) => {
    const labelMap: Record<string, string> = {
      cover: "Cover Page",
      introduction: "Introduction",
      scope: "Scope of Work",
      timeline: "Timeline",
      pricing: "Pricing",
      terms: "Terms & Conditions",
      signature: "Signature",
      custom: "Custom Section",
    };

    const newSection: ProposalSection = {
      id: Date.now().toString(),
      type,
      title: labelMap[type] || "New Section",
      content:
        type === "cover"
          ? JSON.stringify({})
          : type === "signature"
            ? JSON.stringify({ agencySigns: true, clientSigns: true })
            : "",
      order: sections.length,
    };

    setSections([...sections, newSection]);
    setShowAddSection(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
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
    <div>
      {/* Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            onClick={() =>
              (window.location.href = "/dashboard/proposals/templates")
            }
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Back to templates"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {isNew ? "New Template" : "Edit Template"}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              (window.location.href = "/dashboard/proposals/templates")
            }
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isNew ? "Create Template" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-900/20 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Template Details */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Web Development Proposal"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>
        </div>
      </div>

      {/* Sections Editor */}
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Template Sections
        </h3>

        {sections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => (
            <ProposalSectionEditor
              key={section.id}
              section={section}
              onChange={(updated) => handleSectionChange(index, updated)}
              onDelete={() => handleDeleteSection(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          ))}

        {/* Add Section */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddSection(!showAddSection)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Section
          </button>

          {showAddSection && (
            <div className="absolute left-1/2 z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {sectionTypes.map((st) => (
                <button
                  key={st.type}
                  onClick={() => handleAddSection(st.type)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  {st.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalTemplateEditor;
