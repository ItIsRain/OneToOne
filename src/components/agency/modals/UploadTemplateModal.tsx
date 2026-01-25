"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface UploadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { value: "contracts", label: "Contracts" },
  { value: "proposals", label: "Proposals" },
  { value: "finance", label: "Finance" },
  { value: "events", label: "Events" },
  { value: "general", label: "General" },
];

export function UploadTemplateModal({ isOpen, onClose }: UploadTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Template data:", { ...formData, file });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Upload Template
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                <label className="cursor-pointer">
                  <span className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                    Browse Files
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-4">
                  Supported: DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="templateName">Template Name</Label>
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

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Template
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
