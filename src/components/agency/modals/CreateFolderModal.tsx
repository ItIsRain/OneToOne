"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";

interface Folder {
  id: string;
  name: string;
  color: string;
  description?: string;
  parent_folder_id?: string | null;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (folder: Folder) => void;
  folder?: Folder | null;
  parentFolderId?: string | null;
}

const colorOptions = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#64748b", label: "Gray" },
];

export function CreateFolderModal({
  isOpen,
  onClose,
  onSave,
  folder,
  parentFolderId,
}: CreateFolderModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_folder_id: parentFolderId || "",
    color: "#6366f1",
    is_shared: false,
  });

  // Fetch existing folders for parent selection
  useEffect(() => {
    const fetchFolders = async () => {
      setLoadingFolders(true);
      try {
        const res = await fetch("/api/documents/folders");
        const data = await res.json();
        if (res.ok) {
          setFolders(data.folders || []);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoadingFolders(false);
      }
    };
    if (isOpen) fetchFolders();
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name || "",
        description: folder.description || "",
        parent_folder_id: folder.parent_folder_id || "",
        color: folder.color || "#6366f1",
        is_shared: false,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        parent_folder_id: parentFolderId || "",
        color: "#6366f1",
        is_shared: false,
      });
    }
    setError("");
  }, [folder, parentFolderId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!formData.name.trim()) {
        throw new Error("Folder name is required");
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        parent_folder_id: formData.parent_folder_id || null,
        color: formData.color,
        is_shared: formData.is_shared,
      };

      const url = folder
        ? `/api/documents/folders/${folder.id}`
        : "/api/documents/folders";

      const res = await fetch(url, {
        method: folder ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save folder");
      }

      if (onSave) {
        onSave(data.folder);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Filter out current folder and its children from parent options (to prevent circular reference)
  const parentFolderOptions = [
    { value: "", label: "Root (No Parent)" },
    ...folders
      .filter((f) => !folder || f.id !== folder.id)
      .map((f) => ({ value: f.id, label: f.name })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          {folder ? "Edit Folder" : "Create Folder"}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Folder Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter folder name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Add a description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="parent">Parent Folder</Label>
            <Select
              options={parentFolderOptions}
              placeholder={loadingFolders ? "Loading..." : "Select parent folder"}
              value={formData.parent_folder_id}
              onChange={(value) => setFormData({ ...formData, parent_folder_id: value })}
            />
          </div>

          <div>
            <Label>Folder Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: option.value })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    formData.color === option.value
                      ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                />
              ))}
            </div>
          </div>

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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : folder ? "Update Folder" : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
