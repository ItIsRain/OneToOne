"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface ShareInfo {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  thumbnail_url: string | null;
  description: string | null;
  permission_level: string;
  is_password_protected: boolean;
  requires_authentication: boolean;
  message: string | null;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  max_downloads: number | null;
  download_count: number;
}

interface FileAccess {
  file_url: string;
  file_name: string;
  file_type: string;
  mime_type: string | null;
  permission_level: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

function getFileIcon(fileType: string): string {
  const icons: Record<string, string> = {
    pdf: "📕",
    document: "📄",
    spreadsheet: "📊",
    presentation: "📽️",
    image: "🖼️",
    video: "🎬",
    audio: "🎵",
    archive: "📦",
  };
  return icons[fileType] || "📁";
}

export default function SharePage() {
  const params = useParams();
  const link = params.link as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [fileAccess, setFileAccess] = useState<FileAccess | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch share info on mount
  useEffect(() => {
    fetchShareInfo();
  }, [link]);

  const fetchShareInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/documents/shares/access/${link}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load share");
      }

      setShareInfo(data.share);

      // If no password required, automatically get file access
      if (!data.share.is_password_protected) {
        await verifyAndAccess("view", "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load share");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndAccess = async (action: "view" | "download", pwd: string) => {
    try {
      if (action === "view") {
        setIsVerifying(true);
      } else {
        setIsDownloading(true);
      }
      setPasswordError(null);

      const res = await fetch(`/api/documents/shares/access/${link}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd || undefined, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requires_password) {
          // Password needed - don't show error, just wait for input
          return;
        }
        throw new Error(data.error || "Access denied");
      }

      setFileAccess(data);

      if (action === "download" && data.file_url) {
        // Trigger download
        const a = document.createElement("a");
        a.href = data.file_url;
        a.download = data.file_name || "download";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      if (action === "view") {
        setPasswordError(err instanceof Error ? err.message : "Verification failed");
      } else {
        alert(err instanceof Error ? err.message : "Download failed");
      }
    } finally {
      setIsVerifying(false);
      setIsDownloading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAndAccess("view", password);
  };

  const handleDownload = () => {
    verifyAndAccess("download", password);
  };

  const handleView = () => {
    if (fileAccess?.file_url) {
      window.open(fileAccess.file_url, "_blank");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading shared file...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Unable to Access File
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  // Password required state
  if (shareInfo?.is_password_protected && !fileAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Password Protected
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              This file is protected. Enter the password to access it.
            </p>
          </div>

          {shareInfo.file_name && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6">
              <span className="text-2xl">{getFileIcon(shareInfo.file_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-white truncate">
                  {shareInfo.file_name}
                </p>
                <p className="text-sm text-gray-500">{formatFileSize(shareInfo.file_size)}</p>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-colors"
                autoFocus
              />
              {passwordError && (
                <p className="mt-2 text-sm text-error-500">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full h-12 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? "Verifying..." : "Access File"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // File access granted
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">{getFileIcon(shareInfo?.file_type || "")}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{shareInfo?.file_name}</h1>
              <p className="text-white/80 text-sm">
                {formatFileSize(shareInfo?.file_size || 0)} • Shared file
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview/Thumbnail */}
          {shareInfo?.thumbnail_url && (
            <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <Image
                src={shareInfo.thumbnail_url}
                alt={shareInfo.file_name}
                width={600}
                height={400}
                className="w-full h-auto object-contain max-h-64"
              />
            </div>
          )}

          {/* Message from sharer */}
          {shareInfo?.message && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Message from sender:</p>
              <p className="text-gray-700 dark:text-gray-300">{shareInfo.message}</p>
            </div>
          )}

          {/* Description */}
          {shareInfo?.description && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description:</p>
              <p className="text-gray-700 dark:text-gray-300">{shareInfo.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {shareInfo?.view_count || 0}
                {shareInfo?.max_views && (
                  <span className="text-sm font-normal text-gray-500">
                    /{shareInfo.max_views}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {shareInfo?.download_count || 0}
                {shareInfo?.max_downloads && (
                  <span className="text-sm font-normal text-gray-500">
                    /{shareInfo.max_downloads}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">Downloads</p>
            </div>
          </div>

          {/* Expiration notice */}
          {shareInfo?.expires_at && (
            <div className="flex items-center gap-2 text-sm text-warning-600 dark:text-warning-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>
                Expires: {new Date(shareInfo.expires_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleView}
              disabled={!fileAccess?.file_url}
              className="flex-1 h-12 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View File
            </button>

            {fileAccess?.permission_level !== "view" && (
              <button
                onClick={handleDownload}
                disabled={isDownloading || !fileAccess?.file_url}
                className="flex-1 h-12 rounded-lg border-2 border-brand-500 text-brand-500 font-medium hover:bg-brand-50 dark:hover:bg-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Shared securely via OneToOne
          </p>
        </div>
      </div>
    </div>
  );
}
