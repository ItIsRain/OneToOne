"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";

export interface FileShareRecord {
  id: string;
  file_id: string;
  share_type: string; // link, email, client, team
  share_link: string | null;
  share_url: string | null;
  shared_with_email: string | null;
  shared_with_client_id: string | null;
  shared_with_user_id: string | null;
  shared_with_name: string | null;
  permission_level: string; // view, download, edit
  can_reshare: boolean;
  can_comment: boolean;
  is_password_protected: boolean;
  requires_authentication: boolean;
  expires_at: string | null;
  is_expired: boolean;
  max_downloads: number | null;
  download_count: number;
  max_views: number | null;
  view_count: number;
  status: string; // active, revoked, expired
  message: string | null;
  notify_on_access: boolean;
  notify_on_download: boolean;
  last_accessed_at: string | null;
  revoked_at: string | null;
  shared_by: string;
  created_at: string;
  file?: {
    id: string;
    name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    thumbnail_url: string | null;
  } | null;
  client?: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
  } | null;
}

interface ShareStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  total_views: number;
  total_downloads: number;
  by_type: Record<string, number>;
}

interface SharedFilesTableProps {
  onShareSelect?: (share: FileShareRecord) => void;
  selectedShare?: FileShareRecord | null;
  onAddShare?: () => void;
  refreshKey?: number;
}

const statusColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  active: "success",
  expired: "error",
  revoked: "light",
};

const shareTypeIcons: Record<string, string> = {
  link: "🔗",
  email: "📧",
  client: "👤",
  team: "👥",
};

const permissionLabels: Record<string, string> = {
  view: "View Only",
  download: "View & Download",
  edit: "Full Access",
};

export const SharedFilesTable: React.FC<SharedFilesTableProps> = ({
  onShareSelect,
  selectedShare,
  onAddShare,
  refreshKey = 0,
}) => {
  const [shares, setShares] = useState<FileShareRecord[]>([]);
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchShares = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.append("share_type", typeFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await fetch(`/api/documents/shares?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch shares");
      }

      setShares(data.shares || []);
      setStats(data.stats || null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shares");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares, refreshKey]);

  const handleRevoke = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to revoke this share?")) return;

    setRevokingId(id);
    try {
      const res = await fetch(`/api/documents/shares/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke share");
      }

      // Update local state
      setShares(shares.map((s) =>
        s.id === id ? { ...s, status: "revoked" } : s
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setRevokingId(null);
    }
  };

  const handleReactivate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setRevokingId(id);
    try {
      const res = await fetch(`/api/documents/shares/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reactivate share");
      }

      // Update local state
      setShares(shares.map((s) =>
        s.id === id ? { ...s, status: "active", is_expired: false } : s
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reactivate");
    } finally {
      setRevokingId(null);
    }
  };

  const copyShareLink = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const getRecipientDisplay = (share: FileShareRecord) => {
    if (share.shared_with_name) return share.shared_with_name;
    if (share.client) return share.client.name;
    if (share.shared_with_email) return share.shared_with_email;
    return "Public Link";
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return expiry >= now && expiry <= threeDaysFromNow;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
        <p className="text-error-600 dark:text-error-400">{error}</p>
        <button
          onClick={fetchShares}
          className="mt-2 text-sm text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Shares</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.total_views}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Downloads</p>
            <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">{stats.total_downloads}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Shared Files</h3>
            <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-400">
              {shares.length}
            </span>
          </div>
          {onAddShare && (
            <button
              onClick={onAddShare}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share File
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 p-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search shares..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="link">Public Link</option>
            <option value="email">Email</option>
            <option value="client">Client</option>
            <option value="team">Team</option>
          </select>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {shares.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-1">
                No shared files
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Start sharing files with clients and team members"}
              </p>
              {onAddShare && !searchQuery && statusFilter === "all" && typeFilter === "all" && (
                <button
                  onClick={onAddShare}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share a File
                </button>
              )}
            </div>
          ) : (
            shares.map((share) => (
              <div
                key={share.id}
                onClick={() => onShareSelect?.(share)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  selectedShare?.id === share.id ? "bg-brand-50 dark:bg-brand-500/10" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                    {share.file?.thumbnail_url ? (
                      <img
                        src={share.file.thumbnail_url}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white/90 truncate">
                          {share.file?.name || "Unknown File"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg" title={share.share_type}>
                            {shareTypeIcons[share.share_type] || "🔗"}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {getRecipientDisplay(share)}
                          </span>
                        </div>
                      </div>
                      <Badge size="sm" color={statusColors[share.status] || "light"}>
                        {share.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{permissionLabels[share.permission_level] || share.permission_level}</span>
                      <span>•</span>
                      <span>{share.view_count} views</span>
                      <span>•</span>
                      <span>{share.download_count} downloads</span>
                      {share.is_password_protected && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
                            </svg>
                            Protected
                          </span>
                        </>
                      )}
                      {share.expires_at && (
                        <>
                          <span>•</span>
                          <span className={isExpiringSoon(share.expires_at) ? "text-warning-500" : ""}>
                            Expires: {formatDate(share.expires_at)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {share.status === "active" && share.share_url && (
                      <button
                        onClick={(e) => copyShareLink(share.share_url!, e)}
                        className="p-2 text-gray-400 hover:text-brand-500 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800"
                        title="Copy Link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    )}
                    {share.status === "active" ? (
                      <button
                        onClick={(e) => handleRevoke(share.id, e)}
                        disabled={revokingId === share.id}
                        className="px-3 py-1.5 text-sm font-medium text-error-500 hover:bg-error-50 rounded-lg dark:hover:bg-error-500/10"
                        title="Revoke"
                      >
                        Revoke
                      </button>
                    ) : share.status === "revoked" ? (
                      <button
                        onClick={(e) => handleReactivate(share.id, e)}
                        disabled={revokingId === share.id}
                        className="px-3 py-1.5 text-sm font-medium text-success-500 hover:bg-success-50 rounded-lg dark:hover:bg-success-500/10"
                        title="Reactivate"
                      >
                        Reactivate
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
