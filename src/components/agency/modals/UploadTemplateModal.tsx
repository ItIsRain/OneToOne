"use client";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import type { TemplateRecord } from "../TemplatesTable";

interface UploadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (template: TemplateRecord) => void;
  editTemplate?: TemplateRecord | null;
}

const categories = [
  { value: "contracts", label: "Contracts" },
  { value: "proposals", label: "Proposals" },
  { value: "finance", label: "Finance" },
  { value: "events", label: "Events" },
  { value: "reports", label: "Reports" },
  { value: "hr", label: "HR" },
  { value: "marketing", label: "Marketing" },
  { value: "general", label: "General" },
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface TemplateVariable {
  name: string;
  placeholder?: string;
}

export function UploadTemplateModal({ isOpen, onClose, onSuccess, editTemplate }: UploadTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: editTemplate?.name || "",
    category: editTemplate?.category || "general",
    description: editTemplate?.description || "",
    tags: editTemplate?.tags?.join(", ") || "",
    is_active: editTemplate?.is_active ?? true,
    is_default: editTemplate?.is_default ?? false,
    is_public: editTemplate?.is_public ?? false,
  });
  const [variables, setVariables] = useState<TemplateVariable[]>(
    editTemplate?.variables || []
  );
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "variables" | "settings">("basic");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 25MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      return false;
    }
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Supported: DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const addVariable = () => {
    setVariables([...variables, { name: "", placeholder: "" }]);
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: string) => {
    const updated = [...variables];
    updated[index][field] = value;
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file && !editTemplate) {
      setError("Please select a file to upload");
      return;
    }

    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const submitData = new FormData();
      if (file) {
        submitData.append("file", file);
      }
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("category", formData.category);
      submitData.append("is_active", String(formData.is_active));
      submitData.append("is_default", String(formData.is_default));
      submitData.append("is_public", String(formData.is_public));

      // Process tags
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      submitData.append("tags", JSON.stringify(tags));

      // Process variables - filter out empty ones
      const validVariables = variables.filter((v) => v.name.trim());
      submitData.append("variables", JSON.stringify(validVariables));

      const url = editTemplate
        ? `/api/documents/templates/${editTemplate.id}`
        : "/api/documents/templates";

      const method = editTemplate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: submitData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save template");
        return;
      }

      const { template } = await res.json();

      if (onSuccess) {
        onSuccess(template);
      }

      handleClose();
    } catch (err) {
      console.error("Template save error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      category: "general",
      description: "",
      tags: "",
      is_active: true,
      is_default: false,
      is_public: false,
    });
    setVariables([]);
    setFile(null);
    setError(null);
    setActiveTab("basic");
    onClose();
  };

  const tabs = [
    { id: "basic" as const, label: "Basic Info" },
    { id: "variables" as const, label: "Variables" },
    { id: "settings" as const, label: "Settings" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          {editTemplate ? "Edit Template" : "Upload Template"}
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-50 border border-error-200 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <>
              {/* File Upload */}
              {!editTemplate && (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div>
                      <div className="text-4xl mb-3">📄</div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="mt-3 text-sm text-error-500 hover:text-error-600"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-3">📤</div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Drag and drop your template file here
                      </p>
                      <p className="text-sm text-gray-500 mb-4">or</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                      >
                        Browse Files
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                      />
                      <p className="text-xs text-gray-400 mt-4">
                        Supported: DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX (Max 25MB)
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Service Agreement Template"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  options={categories}
                  defaultValue={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  placeholder="Select category"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="Describe when to use this template..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., legal, contract, agreement"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Variables Tab */}
          {activeTab === "variables" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">Template Variables</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Define placeholders like {"{{client_name}}"} that can be replaced when using this template.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addVariable}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  + Add Variable
                </button>
              </div>

              {variables.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                  <p className="text-sm text-gray-500">No variables defined yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Add Variable" to create placeholders.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variables.map((variable, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`var-name-${index}`}>Variable Name</Label>
                          <Input
                            id={`var-name-${index}`}
                            placeholder="e.g., client_name"
                            value={variable.name}
                            onChange={(e) => updateVariable(index, "name", e.target.value)}
                          />
                          {variable.name && (
                            <p className="text-xs text-gray-400 mt-1">
                              Use as: <code className="text-brand-500">{`{{${variable.name}}}`}</code>
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`var-placeholder-${index}`}>Placeholder Text</Label>
                          <Input
                            id={`var-placeholder-${index}`}
                            placeholder="e.g., Enter client name"
                            value={variable.placeholder}
                            onChange={(e) => updateVariable(index, "placeholder", e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariable(index)}
                        className="mt-6 p-1.5 rounded text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">Active</span>
                    <p className="text-xs text-gray-500">Template is available for use</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">Default Template</span>
                    <p className="text-xs text-gray-500">Use as default for this category</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">Team-wide Access</span>
                    <p className="text-xs text-gray-500">Allow all team members to use this template</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || (!file && !editTemplate)}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Saving..." : editTemplate ? "Update Template" : "Upload Template"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
