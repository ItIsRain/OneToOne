"use client";
import React, { useState, useEffect, useCallback } from "react";

export interface FileRecord {
  id: string;
  tenant_id: string;
  folder_id: string | null;
  name: string;
  original_name: string;
  description: string | null;
  file_url: string;
  cloudinary_public_id: string;
  file_type: string;
  mime_type: string | null;
  file_size: number;
  file_extension: string | null;
  thumbnail_url: string | null;
  tags: string[];
  is_shared: boolean;
  shared_with: string[];
  is_starred: boolean;
  is_archived: boolean;
  version: number;
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  folder?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface FolderRecord {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  parent_folder_id: string | null;
  color: string;
  icon: string;
  is_shared: boolean;
  shared_with: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface FileStats {
  total_files: number;
  total_size: number;
  by_type: {
    image: number;
    document: number;
    video: number;
    audio: number;
    other: number;
  };
  starred: number;
  archived: number;
}

interface FilesTableProps {
  onFileSelect?: (file: FileRecord) => void;
  selectedFile?: FileRecord | null;
  onFolderChange?: (folderId: string | null, folderName: string | null) => void;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  image: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  audio: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  pdf: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  spreadsheet: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  archive: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
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

export function FilesTable({ onFileSelect, selectedFile, onFolderChange }: FilesTableProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigation & Filters
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "All Files" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showStarred, setShowStarred] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Build query params
      const fileParams = new URLSearchParams();
      if (currentFolderId) {
        fileParams.set("folder_id", currentFolderId);
      } else {
        fileParams.set("folder_id", "root");
      }
      if (filterType) fileParams.set("file_type", filterType);
      if (showStarred) fileParams.set("is_starred", "true");
      if (showArchived) fileParams.set("is_archived", "true");
      else fileParams.set("is_archived", "false");
      if (searchQuery) fileParams.set("search", searchQuery);

      const folderParams = new URLSearchParams();
      if (currentFolderId) {
        folderParams.set("parent_id", currentFolderId);
      } else {
        folderParams.set("parent_id", "root");
      }

      // Fetch files and folders in parallel
      const [filesRes, foldersRes] = await Promise.all([
        fetch(`/api/documents/files?${fileParams.toString()}`),
        fetch(`/api/documents/folders?${folderParams.toString()}`),
      ]);

      const filesData = await filesRes.json();
      const foldersData = await foldersRes.json();

      if (!filesRes.ok) throw new Error(filesData.error || "Failed to fetch files");
      if (!foldersRes.ok) throw new Error(foldersData.error || "Failed to fetch folders");

      setFiles(filesData.files || []);
      setFolders(foldersData.folders || []);
      setStats(filesData.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, filterType, showStarred, showArchived, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateToFolder = async (folderId: string | null, folderName: string) => {
    // Build new breadcrumbs
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: "All Files" }]);
    } else {
      const existingIndex = breadcrumbs.findIndex((b) => b.id === folderId);
      if (existingIndex >= 0) {
        setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
    }
    setCurrentFolderId(folderId);

    // Notify parent of folder change
    if (onFolderChange) {
      onFolderChange(folderId, folderId ? folderName : null);
    }
  };

  const toggleStar = async (file: FileRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/documents/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: !file.is_starred }),
      });
      if (res.ok) {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, is_starred: !f.is_starred } : f))
        );
      }
    } catch {
      // Ignore errors
    }
  };

  const deleteFile = async (file: FileRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      const res = await fetch(`/api/documents/files/${file.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        if (selectedFile?.id === file.id && onFileSelect) {
          onFileSelect(null as unknown as FileRecord);
        }
      }
    } catch {
      // Ignore errors
    }
  };

  const deleteFolder = async (folder: FolderRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${folder.name}" and all its contents?`)) return;

    try {
      const res = await fetch(`/api/documents/folders/${folder.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      }
    } catch {
      // Ignore errors
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20">
                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.total_files}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatFileSize(stats.total_size)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-500/20">
                <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Images</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.by_type.image}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.by_type.document}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id || "root"}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                onClick={() => navigateToFolder(crumb.id, crumb.name)}
                className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  index === breadcrumbs.length - 1
                    ? "font-medium text-gray-800 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-48 rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter by type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="pdf">PDFs</option>
            <option value="spreadsheet">Spreadsheets</option>
            <option value="archive">Archives</option>
          </select>

          {/* Starred filter */}
          <button
            onClick={() => setShowStarred(!showStarred)}
            className={`h-10 px-3 rounded-lg border text-sm ${
              showStarred
                ? "border-yellow-500 bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400"
                : "border-gray-300 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
            }`}
          >
            <svg className="w-5 h-5" fill={showStarred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-10 px-3 ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}`}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-10 px-3 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}`}
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-error-50 p-4 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {/* Folders */}
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => navigateToFolder(folder.id, folder.name)}
                  className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: folder.color + "20", color: folder.color }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate text-center">
                    {folder.name}
                  </p>
                  <button
                    onClick={(e) => deleteFolder(folder, e)}
                    className="absolute top-2 right-2 hidden h-6 w-6 items-center justify-center rounded bg-error-100 text-error-600 group-hover:flex dark:bg-error-500/20 dark:text-error-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Files */}
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onFileSelect && onFileSelect(file)}
                  className={`group relative cursor-pointer rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-gray-800 ${
                    selectedFile?.id === file.id
                      ? "border-brand-500 ring-2 ring-brand-500/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-brand-500"
                  }`}
                >
                  {/* Thumbnail or Icon */}
                  <div className="mb-3">
                    {file.thumbnail_url ? (
                      <img
                        src={file.thumbnail_url}
                        alt={file.name}
                        className="h-16 w-full object-cover rounded-lg"
                      />
                    ) : (
                      <div
                        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${
                          fileTypeColors[file.file_type] || fileTypeColors.other
                        }`}
                      >
                        {fileTypeIcons[file.file_type] || fileTypeIcons.other}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatFileSize(file.file_size)}
                  </p>

                  {/* Star button */}
                  <button
                    onClick={(e) => toggleStar(file, e)}
                    className={`absolute top-2 left-2 h-6 w-6 items-center justify-center rounded ${
                      file.is_starred
                        ? "flex text-yellow-500"
                        : "hidden group-hover:flex text-gray-400 hover:text-yellow-500"
                    }`}
                  >
                    <svg className="w-4 h-4" fill={file.is_starred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteFile(file, e)}
                    className="absolute top-2 right-2 hidden h-6 w-6 items-center justify-center rounded bg-error-100 text-error-600 group-hover:flex dark:bg-error-500/20 dark:text-error-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Empty State */}
              {folders.length === 0 && files.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">No files yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Upload files or create folders to get started
                  </p>
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Modified</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Folders */}
                  {folders.map((folder) => (
                    <tr
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id, folder.name)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded"
                            style={{ backgroundColor: folder.color + "20", color: folder.color }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white">{folder.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Folder</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">--</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(folder.updated_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => deleteFolder(folder, e)}
                          className="text-gray-400 hover:text-error-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Files */}
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      onClick={() => onFileSelect && onFileSelect(file)}
                      className={`cursor-pointer ${
                        selectedFile?.id === file.id
                          ? "bg-brand-50 dark:bg-brand-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded ${fileTypeColors[file.file_type] || fileTypeColors.other}`}>
                            {fileTypeIcons[file.file_type] || fileTypeIcons.other}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-white">{file.name}</span>
                            {file.is_starred && (
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">{file.file_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.file_size)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(file.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleStar(file, e)}
                            className={`${file.is_starred ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"}`}
                          >
                            <svg className="w-5 h-5" fill={file.is_starred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => deleteFile(file, e)}
                            className="text-gray-400 hover:text-error-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Empty State */}
                  {folders.length === 0 && files.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-800 dark:text-white">No files yet</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Upload files or create folders to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
