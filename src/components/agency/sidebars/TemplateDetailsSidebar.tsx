"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { TemplateRecord } from "../TemplatesTable";

interface TemplateDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateRecord | null;
  onEdit: (template: TemplateRecord) => void;
  onDelete?: (id: string) => void;
  onUse?: (template: TemplateRecord) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

const categoryColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  contracts: "primary",
  proposals: "success",
  finance: "warning",
  events: "error",
  reports: "light",
  hr: "primary",
  marketing: "success",
  general: "light",
};

const categoryLabels: Record<string, string> = {
  contracts: "Contracts",
  proposals: "Proposals",
  finance: "Finance",
  events: "Events",
  reports: "Reports",
  hr: "HR",
  marketing: "Marketing",
  general: "General",
};

const fileTypeLabels: Record<string, string> = {
  document: "Document",
  spreadsheet: "Spreadsheet",
  presentation: "Presentation",
  pdf: "PDF",
  image: "Image",
  other: "Other",
};

export const TemplateDetailsSidebar: React.FC<TemplateDetailsSidebarProps> = ({
  isOpen,
  onClose,
  template,
  onEdit,
  onDelete,
  onUse,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUsing, setIsUsing] = useState(false);

  if (!template) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(template.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUse = async () => {
    setIsUsing(true);
    try {
      // Track usage
      await fetch(`/api/documents/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use" }),
      });

      if (onUse) {
        onUse(template);
      } else {
        window.open(template.file_url, "_blank");
      }
    } finally {
      setIsUsing(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(template)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <a
        href={template.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Download"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
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
      title={template.name}
      subtitle={`Version ${template.version}`}
      headerActions={headerActions}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={categoryColors[template.category] || "light"}>
              {categoryLabels[template.category] || template.category}
            </Badge>
            {template.is_default && (
              <Badge size="sm" color="primary">Default</Badge>
            )}
            {!template.is_active && (
              <Badge size="sm" color="light">Inactive</Badge>
            )}
          </div>
          <button
            onClick={handleUse}
            disabled={isUsing}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {isUsing ? "Opening..." : "Use Template"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Usage Stats */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={3}>
            <StatItem label="Total Uses" value={template.use_count} />
            <StatItem label="Version" value={template.version} />
            <StatItem label="File Size" value={formatFileSize(template.file_size)} />
          </StatsGrid>
        </div>

        {/* Template Details */}
        <Section title="Template Details">
          <InfoRow label="Name" value={template.name} />
          <InfoRow
            label="Category"
            value={
              <Badge size="sm" color={categoryColors[template.category] || "light"}>
                {categoryLabels[template.category] || template.category}
              </Badge>
            }
          />
          <InfoRow label="File Type" value={fileTypeLabels[template.file_type] || template.file_type} />
          <InfoRow label="Extension" value={template.file_extension?.toUpperCase()} />
          <InfoRow label="Size" value={formatFileSize(template.file_size)} />
          <InfoRow label="Last Used" value={formatDate(template.last_used_at)} />
        </Section>

        {/* Description */}
        {template.description && (
          <Section title="Description">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {template.description}
            </p>
          </Section>
        )}

        {/* Template Variables */}
        {template.variables && template.variables.length > 0 && (
          <Section title="Template Variables">
            <div className="space-y-2">
              {template.variables.map((variable, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <code className="text-sm font-mono text-brand-500">
                    {`{{${variable.name}}}`}
                  </code>
                  {variable.placeholder && (
                    <span className="text-xs text-gray-500">{variable.placeholder}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              These variables will be replaced when using this template.
            </p>
          </Section>
        )}

        {/* Settings */}
        <Section title="Settings">
          <InfoRow
            label="Status"
            value={
              <Badge size="sm" color={template.is_active ? "success" : "light"}>
                {template.is_active ? "Active" : "Inactive"}
              </Badge>
            }
          />
          <InfoRow label="Default Template" value={template.is_default ? "Yes" : "No"} />
          <InfoRow label="Public" value={template.is_public ? "Yes (Team-wide)" : "No (Private)"} />
        </Section>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(template.created_at)}</p>
          <p>Updated: {formatDate(template.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default TemplateDetailsSidebar;
