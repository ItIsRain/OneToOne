"use client";
import React, { useState } from "react";
import { DetailsSidebar, Section, InfoRow } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";

interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  category: string;
  priority: string;
  is_pinned: boolean;
  is_published: boolean;
  publish_at: string | null;
  expires_at: string | null;
  views_count: number;
  reactions: Record<string, number>;
  created_at: string;
  updated_at: string;
}

interface AnnouncementDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (id: string) => void;
}

const categoryColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  general: "light",
  update: "primary",
  alert: "error",
  celebration: "success",
  policy: "warning",
  reminder: "warning",
};

const priorityColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  low: "light",
  normal: "primary",
  high: "warning",
  urgent: "error",
};

const reactionEmojis: Record<string, string> = {
  like: "👍",
  love: "❤️",
  celebrate: "🎉",
  insightful: "💡",
  curious: "🤔",
};

export const AnnouncementDetailsSidebar: React.FC<AnnouncementDetailsSidebarProps> = ({
  isOpen,
  onClose,
  announcement,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  if (!announcement) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete?.(announcement.id);
        onClose();
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReaction = async (reactionType: string) => {
    setIsReacting(true);
    try {
      await fetch(`/api/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add_reaction: reactionType }),
      });
    } catch (error) {
      console.error("Reaction error:", error);
    } finally {
      setIsReacting(false);
    }
  };

  const headerActions = (
    <>
      {onEdit && (
        <button
          onClick={() => onEdit(announcement)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Edit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400"
          title="Delete"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      title={announcement.title}
      subtitle={`${announcement.category} announcement`}
      headerActions={headerActions}
      width="lg"
    >
      <div className="space-y-6">
        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={categoryColors[announcement.category] || "light"}>
            {announcement.category}
          </Badge>
          {announcement.priority !== "normal" && (
            <Badge color={priorityColors[announcement.priority] || "light"}>
              {announcement.priority}
            </Badge>
          )}
          {announcement.is_pinned && (
            <Badge color="primary">Pinned</Badge>
          )}
          {!announcement.is_published && (
            <Badge color="warning">Draft</Badge>
          )}
        </div>

        {/* Cover Image */}
        {announcement.image_url && (
          <div className="rounded-xl overflow-hidden">
            <img
              src={announcement.image_url}
              alt=""
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <Section title="Content">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>
        </Section>

        {/* Reactions */}
        <Section title="Reactions">
          <div className="flex flex-wrap gap-2">
            {Object.entries(reactionEmojis).map(([type, emoji]) => {
              const count = announcement.reactions?.[type] || 0;
              return (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  disabled={isReacting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                    count > 0
                      ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  {count > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Statistics */}
        <Section title="Statistics">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {announcement.views_count}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Reactions</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {Object.values(announcement.reactions || {}).reduce((a, b) => a + b, 0)}
              </p>
            </div>
          </div>
        </Section>

        {/* Scheduling */}
        {(announcement.publish_at || announcement.expires_at) && (
          <Section title="Schedule">
            {announcement.publish_at && (
              <InfoRow
                label="Publish Date"
                value={formatDate(announcement.publish_at)}
              />
            )}
            {announcement.expires_at && (
              <InfoRow
                label="Expiry Date"
                value={formatDate(announcement.expires_at)}
              />
            )}
          </Section>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            <p>Created: {formatDate(announcement.created_at)}</p>
            <p>Updated: {formatDate(announcement.updated_at)}</p>
          </div>
        </div>
      </div>
    </DetailsSidebar>
  );
};
