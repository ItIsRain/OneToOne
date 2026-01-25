"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    files: [] as File[],
    folder: "",
    tags: "",
    shareWith: "",
  });
  const [isDragging, setIsDragging] = useState(false);

  const folderOptions = [
    { value: "root", label: "Root (All Files)" },
    { value: "contracts", label: "Contracts" },
    { value: "templates", label: "Templates" },
    { value: "client-files", label: "Client Files" },
    { value: "marketing", label: "Marketing Assets" },
  ];

  const shareOptions = [
    { value: "private", label: "Private (Only me)" },
    { value: "team", label: "Team" },
    { value: "specific", label: "Specific People" },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFormData({ ...formData, files: [...formData.files, ...droppedFiles] });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFormData({ ...formData, files: [...formData.files, ...selectedFiles] });
    }
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      files: formData.files.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Upload data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Upload Files
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload one or more files to your documents
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label>Files</Label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
              isDragging
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "border-gray-300 dark:border-gray-700"
            }`}
          >
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <label className="cursor-pointer text-brand-500 hover:text-brand-600 font-medium">
                  Click to upload
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                  />
                </label>
                {" "}or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOC, XLS, PNG, JPG up to 50MB each
              </p>
            </div>
          </div>
        </div>

        {formData.files.length > 0 && (
          <div>
            <Label>Selected Files ({formData.files.length})</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {formData.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {file.name.split(".").pop()?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-error-500"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="folder">Destination Folder</Label>
            <Select
              options={folderOptions}
              placeholder="Select folder"
              onChange={(value) => setFormData({ ...formData, folder: value })}
            />
          </div>
          <div>
            <Label htmlFor="shareWith">Share With</Label>
            <Select
              options={shareOptions}
              placeholder="Select visibility"
              onChange={(value) => setFormData({ ...formData, shareWith: value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input
            id="tags"
            type="text"
            placeholder="Add tags separated by commas"
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formData.files.length === 0}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload {formData.files.length > 0 && `(${formData.files.length})`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
