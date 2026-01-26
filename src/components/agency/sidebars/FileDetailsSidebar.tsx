"use client";
import React, { useState, useEffect } from "react";
import type { FileRecord } from "../FilesTable";

interface FileDetailsSidebarProps {
  file: FileRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (file: FileRecord) => void;
}

export function FileDetailsSidebar({
  file,
  isOpen,
  onClose,
  onUpdate,
}: FileDetailsSidebarProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: "",
    is_shared: false,
  });

  useEffect(() => {
    if (file) {
      setFormData({
        name: file.name,
        description: file.description || "",
        tags: file.tags?.join(", ") || "",
        is_shared: file.is_shared,
      });
      setEditing(false);
    }
  }, [file]);

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);

    try {
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch(`/api/documents/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          tags: tags,
          is_shared: formData.is_shared,
        }),
      });

      const data = await res.json();
      if (res.ok && onUpdate) {
        onUpdate(data.file);
      }
      setEditing(false);
    } catch {
      // Ignore errors
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const fileTypeColors: Record<string, string> = {
    image: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    video: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
    audio: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    pdf: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    document: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    spreadsheet: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    archive: "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
    other: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            File Details
          </h2>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Preview */}
          <div className="mb-6">
            {file.file_type === "image" && file.file_url ? (
              <img
                src={file.file_url}
                alt={file.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div
                className={`flex h-32 w-full items-center justify-center rounded-lg ${
                  fileTypeColors[file.file_type] || fileTypeColors.other
                }`}
              >
                <div className="text-center">
                  <span className="text-4xl font-bold uppercase">
                    {file.file_extension || file.file_type}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                File Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                  {file.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Description
              </label>
              {editing ? (
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Add a description..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {file.description || "No description"}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Tags
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Add tags separated by commas..."
                />
              ) : (
                <div className="mt-1 flex flex-wrap gap-1">
                  {file.tags && file.tags.length > 0 ? (
                    file.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No tags</span>
                  )}
                </div>
              )}
            </div>

            {/* Share toggle */}
            {editing && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_shared"
                  checked={formData.is_shared}
                  onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="is_shared" className="text-sm text-gray-600 dark:text-gray-400">
                  Share with team
                </label>
              </div>
            )}

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* File Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </label>
                <p className="mt-1 text-sm text-gray-800 dark:text-white capitalize">
                  {file.file_type}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Size
                </label>
                <p className="mt-1 text-sm text-gray-800 dark:text-white">
                  {formatFileSize(file.file_size)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Extension
                </label>
                <p className="mt-1 text-sm text-gray-800 dark:text-white uppercase">
                  {file.file_extension || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  MIME Type
                </label>
                <p className="mt-1 text-sm text-gray-800 dark:text-white">
                  {file.mime_type || "N/A"}
                </p>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Folder */}
            {file.folder && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Folder
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded"
                    style={{ backgroundColor: file.folder.color + "20", color: file.folder.color }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-800 dark:text-white">{file.folder.name}</span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Uploaded
              </label>
              <p className="mt-1 text-sm text-gray-800 dark:text-white">
                {formatDate(file.created_at)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Last Modified
              </label>
              <p className="mt-1 text-sm text-gray-800 dark:text-white">
                {formatDate(file.updated_at)}
              </p>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {file.is_starred && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Starred
                </span>
              )}
              {file.is_shared && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Shared
                </span>
              )}
              {file.is_archived && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-500/20 dark:text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archived
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex gap-3">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-600"
            >
              Download
            </a>
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Open
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
