"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface PortalFile {
  id: string;
  tenant_id: string;
  portal_client_id: string | null;
  project_id: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: "agency" | "client";
  created_at: string;
}

interface PortalFilesListProps {
  portalClientId: string;
}

const formatFileSize = (bytes: number | null) => {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const PortalFilesList: React.FC<PortalFilesListProps> = ({
  portalClientId,
}) => {
  const [files, setFiles] = useState<PortalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/portal/files", {
        headers: { "x-portal-client-id": portalClientId },
      });
      if (!res.ok) throw new Error("Failed to load files");
      const json = await res.json();
      setFiles(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [portalClientId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileUrl.trim()) return;

    // Validate URL is not an internal/private address
    try {
      const url = new URL(newFileUrl);
      const hostname = url.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("172.") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal") ||
        url.protocol === "file:"
      ) {
        setError("Invalid file URL: internal addresses are not allowed");
        return;
      }
    } catch {
      setError("Invalid URL format");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/portal/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-portal-client-id": portalClientId,
        },
        body: JSON.stringify({
          file_name: newFileName || newFileUrl.split("/").pop() || "file",
          file_url: newFileUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to upload file");

      setNewFileName("");
      setNewFileUrl("");
      setShowUpload(false);
      await fetchFiles();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-lime-500" />
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Files
        </h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-600"
        >
          {showUpload ? "Cancel" : "Upload File"}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <form
          onSubmit={handleUpload}
          className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                File Name
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Optional file name"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                File URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={newFileUrl}
                onChange={(e) => setNewFileUrl(e.target.value)}
                required
                placeholder="https://example.com/file.pdf"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-600 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Add File"}
            </button>
          </div>
        </form>
      )}

      {files.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
          No files shared yet.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 sm:hidden">
            {files.map((file) => (
              <div
                key={file.id}
                className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate text-sm font-medium text-lime-600 hover:underline dark:text-lime-400"
                  >
                    {file.file_name}
                  </a>
                  <Badge
                    color={file.uploaded_by === "agency" ? "info" : "success"}
                    size="sm"
                  >
                    {file.uploaded_by === "agency" ? "Agency" : "Client"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{file.file_type || "-"}</span>
                  <span>{formatFileSize(file.file_size)}</span>
                </div>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900 sm:block">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      File Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Size
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Uploaded By
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Date
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow
                      key={file.id}
                      className="border-b border-gray-50 dark:border-gray-800"
                    >
                      <TableCell className="px-5 py-3.5">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-lime-600 hover:underline dark:text-lime-400"
                        >
                          {file.file_name}
                        </a>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                        {file.file_type || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                        {formatFileSize(file.file_size)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <Badge
                          color={
                            file.uploaded_by === "agency" ? "info" : "success"
                          }
                          size="sm"
                        >
                          {file.uploaded_by === "agency" ? "Agency" : "Client"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(file.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
