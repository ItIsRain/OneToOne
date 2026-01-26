"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { FileShareRecord } from "../SharedFilesTable";

interface ShareDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  share: FileShareRecord | null;
  onRevoke?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

const statusColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  active: "success",
  expired: "error",
  revoked: "light",
};

const shareTypeLabels: Record<string, string> = {
  link: "Public Link",
  email: "Email Share",
  client: "Client Share",
  team: "Team Share",
};

const permissionLabels: Record<string, string> = {
  view: "View Only",
  download: "View & Download",
  edit: "Full Access",
};

export const ShareDetailsSidebar: React.FC<ShareDetailsSidebarProps> = ({
  isOpen,
  onClose,
  share,
  onRevoke,
  onReactivate,
  onDelete,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!share) return null;

  const isExpired = share.expires_at && new Date(share.expires_at) < new Date();
  const isExpiringSoon = share.expires_at && !isExpired && (() => {
    const expiry = new Date(share.expires_at!);
    const now = new Date();
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);
    return expiry <= threeDays;
  })();

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke this share?")) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/documents/shares/${share.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });

      if (res.ok && onRevoke) {
        onRevoke(share.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivate = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/documents/shares/${share.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });

      if (res.ok && onReactivate) {
        onReactivate(share.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this share?")) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/documents/shares/${share.id}`, {
        method: "DELETE",
      });

      if (res.ok && onDelete) {
        onDelete(share.id);
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyLink = () => {
    if (share.share_url) {
      navigator.clipboard.writeText(share.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRecipientDisplay = () => {
    if (share.shared_with_name) return share.shared_with_name;
    if (share.client) return `${share.client.name}${share.client.company ? ` (${share.client.company})` : ""}`;
    if (share.shared_with_email) return share.shared_with_email;
    return "Anyone with the link";
  };

  const headerActions = (
    <>
      {share.share_url && share.status === "active" && (
        <button
          onClick={copyLink}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={copied ? "Copied!" : "Copy Link"}
        >
          {copied ? (
            <svg className="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isProcessing}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={share.file?.name || "Shared File"}
      subtitle={shareTypeLabels[share.share_type] || share.share_type}
      headerActions={headerActions}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <Badge size="sm" color={statusColors[share.status] || "light"}>
            {share.status}
          </Badge>
          {share.status === "active" && onRevoke && (
            <button
              onClick={handleRevoke}
              disabled={isProcessing}
              className="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600 transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Revoke Share"}
            </button>
          )}
          {share.status === "revoked" && onReactivate && (
            <button
              onClick={handleReactivate}
              disabled={isProcessing}
              className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Reactivate"}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Access Stats */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={2}>
            <StatItem label="Views" value={share.view_count} color="text-brand-500" />
            <StatItem label="Downloads" value={share.download_count} color="text-success-500" />
          </StatsGrid>
        </div>

        {/* Share Link */}
        {share.share_url && share.status === "active" && (
          <Section title="Share Link">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={share.share_url}
                className="flex-1 h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              <button
                onClick={copyLink}
                className="h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </Section>
        )}

        {/* File Details */}
        {share.file && (
          <Section title="File Details">
            <InfoRow label="File Name" value={share.file.name} />
            <InfoRow label="Type" value={share.file.file_type} />
            <InfoRow label="Size" value={formatFileSize(share.file.file_size)} />
            {share.file.file_url && (
              <InfoRow
                label="Preview"
                value={
                  <a
                    href={share.file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    Open File
                  </a>
                }
              />
            )}
          </Section>
        )}

        {/* Recipient */}
        <Section title="Shared With">
          <InfoRow label="Recipient" value={getRecipientDisplay()} />
          {share.client && (
            <>
              {share.client.email && (
                <InfoRow
                  label="Email"
                  value={
                    <a href={`mailto:${share.client.email}`} className="text-brand-500 hover:text-brand-600">
                      {share.client.email}
                    </a>
                  }
                />
              )}
              {share.client.company && (
                <InfoRow label="Company" value={share.client.company} />
              )}
            </>
          )}
          {share.shared_with_email && !share.client && (
            <InfoRow
              label="Email"
              value={
                <a href={`mailto:${share.shared_with_email}`} className="text-brand-500 hover:text-brand-600">
                  {share.shared_with_email}
                </a>
              }
            />
          )}
        </Section>

        {/* Permissions */}
        <Section title="Permissions">
          <InfoRow label="Permission Level" value={permissionLabels[share.permission_level] || share.permission_level} />
          <InfoRow label="Can Reshare" value={share.can_reshare ? "Yes" : "No"} />
          <InfoRow label="Can Comment" value={share.can_comment ? "Yes" : "No"} />
        </Section>

        {/* Security */}
        <Section title="Security">
          <InfoRow
            label="Password Protected"
            value={
              share.is_password_protected ? (
                <span className="flex items-center gap-1 text-success-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
                  </svg>
                  Yes
                </span>
              ) : (
                "No"
              )
            }
          />
          <InfoRow label="Requires Login" value={share.requires_authentication ? "Yes" : "No"} />
        </Section>

        {/* Limits */}
        {(share.max_downloads || share.max_views || share.expires_at) && (
          <Section title="Limits">
            {share.max_views && (
              <InfoRow
                label="Max Views"
                value={`${share.view_count} / ${share.max_views}`}
              />
            )}
            {share.max_downloads && (
              <InfoRow
                label="Max Downloads"
                value={`${share.download_count} / ${share.max_downloads}`}
              />
            )}
            {share.expires_at && (
              <InfoRow
                label="Expires"
                value={
                  <span className={isExpired ? "text-error-500 font-medium" : isExpiringSoon ? "text-warning-500 font-medium" : ""}>
                    {formatDate(share.expires_at)}
                    {isExpired && " (Expired)"}
                    {isExpiringSoon && " (Expiring Soon)"}
                  </span>
                }
              />
            )}
          </Section>
        )}

        {/* Message */}
        {share.message && (
          <Section title="Message to Recipient">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {share.message}
            </p>
          </Section>
        )}

        {/* Notifications */}
        <Section title="Notifications">
          <InfoRow label="Notify on Access" value={share.notify_on_access ? "Enabled" : "Disabled"} />
          <InfoRow label="Notify on Download" value={share.notify_on_download ? "Enabled" : "Disabled"} />
        </Section>

        {/* Activity */}
        <Section title="Activity">
          <InfoRow label="Created" value={formatDate(share.created_at)} />
          <InfoRow label="Last Accessed" value={formatDate(share.last_accessed_at)} />
          {share.status === "revoked" && (
            <InfoRow label="Revoked" value={formatDate(share.revoked_at as string)} />
          )}
        </Section>
      </div>
    </DetailsSidebar>
  );
};

export default ShareDetailsSidebar;
