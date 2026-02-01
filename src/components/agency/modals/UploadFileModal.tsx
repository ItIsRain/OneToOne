"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface Folder {
  id: string;
  name: string;
  color: string;
}

interface UploadedFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (files: UploadedFile[]) => void;
  currentFolderId?: string | null;
  currentFolderName?: string | null;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  currentFolderId,
  currentFolderName,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    files: [] as File[],
    folder_id: currentFolderId || "root",
    tags: "",
    description: "",
    is_shared: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  // Fetch folders only if not already in a folder
  useEffect(() => {
    const fetchFolders = async () => {
      if (currentFolderId) return; // Don't fetch if already in a folder

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
  }, [isOpen, currentFolderId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        files: [],
        folder_id: currentFolderId || "root",
        tags: "",
        description: "",
        is_shared: false,
      });
      setError("");
      setUploadProgress({});
    }
  }, [isOpen, currentFolderId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

  const validateFiles = (files: File[]): { valid: File[]; rejected: string[] } => {
    const valid: File[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`"${file.name}" exceeds 50MB limit (${formatFileSize(file.size)})`);
      } else {
        valid.push(file);
      }
    }

    return { valid, rejected };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const { valid, rejected } = validateFiles(droppedFiles);

    if (rejected.length > 0) {
      setError(`Files too large: ${rejected.join(", ")}`);
    }

    if (valid.length > 0) {
      setFormData({ ...formData, files: [...formData.files, ...valid] });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const { valid, rejected } = validateFiles(selectedFiles);

      if (rejected.length > 0) {
        setError(`Files too large: ${rejected.join(", ")}`);
      }

      if (valid.length > 0) {
        setFormData({ ...formData, files: [...formData.files, ...valid] });
      }
    }
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      files: formData.files.filter((_, i) => i !== index),
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUploading(true);

    const uploadedFiles: UploadedFile[] = [];
    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Convert "root" to null for API
    const folderId = formData.folder_id === "root" ? null : formData.folder_id;

    try {
      for (let i = 0; i < formData.files.length; i++) {
        const file = formData.files[i];
        setUploadProgress((prev) => ({ ...prev, [i]: 10 }));

        // Convert file to base64
        const base64 = await fileToBase64(file);
        setUploadProgress((prev) => ({ ...prev, [i]: 30 }));

        // Upload to API
        const res = await fetch("/api/documents/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            name: file.name,
            folder_id: folderId,
            description: formData.description || null,
            tags: tags,
            is_shared: formData.is_shared,
          }),
        });

        setUploadProgress((prev) => ({ ...prev, [i]: 90 }));

        const data = await res.json();

        if (!res.ok) {
          // Check if this is a malware detection error
          if (data.scanResult) {
            toast.error(
              `⚠️ Security Alert: "${file.name}" was blocked. Detected as malicious by ${data.scanResult.malicious} security vendor(s).`
            );
            return;
          }
          toast.error(data.error || `Failed to upload ${file.name}`);
          return;
        }

        uploadedFiles.push(data.file);
        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
      }

      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  // Determine the destination display
  const getDestinationDisplay = () => {
    if (currentFolderId && currentFolderName) {
      return currentFolderName;
    }
    if (formData.folder_id === "root") {
      return "Root (All Files)";
    }
    const folder = folders.find((f) => f.id === formData.folder_id);
    return folder?.name || "Root (All Files)";
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

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Destination Info - Show current folder or allow selection */}
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">Uploading to:</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {getDestinationDisplay()}
            </span>
          </div>

          {/* Only show folder selector if not already in a folder */}
          {!currentFolderId && (
            <div className="mt-3">
              <select
                value={formData.folder_id}
                onChange={(e) => setFormData({ ...formData, folder_id: e.target.value })}
                disabled={uploading || loadingFolders}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="root">Root (All Files)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              {loadingFolders && (
                <p className="text-xs text-gray-400 mt-1">Loading folders...</p>
              )}
            </div>
          )}
        </div>

        {/* File Drop Zone */}
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
                    disabled={uploading}
                  />
                </label>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOC, XLS, PNG, JPG, MP4, and more up to 50MB each
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {formData.files.length > 0 && (
          <div>
            <Label>Selected Files ({formData.files.length})</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {formData.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {file.name.split(".").pop()?.toUpperCase().slice(0, 4)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    {uploadProgress[index] !== undefined && (
                      <div className="w-16">
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 transition-all duration-300"
                            style={{ width: `${uploadProgress[index]}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-gray-400 hover:text-error-500"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input
            id="tags"
            type="text"
            placeholder="Add tags separated by commas"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            disabled={uploading}
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <textarea
            id="description"
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            placeholder="Add a description for these files..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={uploading}
          />
        </div>

        {/* Share checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_shared"
            checked={formData.is_shared}
            onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            disabled={uploading}
          />
          <label htmlFor="is_shared" className="text-sm text-gray-600 dark:text-gray-400">
            Share with team
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formData.files.length === 0 || uploading}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? "Uploading..."
              : `Upload ${formData.files.length > 0 ? `(${formData.files.length})` : ""}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
