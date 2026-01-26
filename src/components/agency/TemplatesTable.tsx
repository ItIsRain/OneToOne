"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";

export interface TemplateRecord {
  id: string;
  name: string;
  description: string | null;
  category: string;
  file_url: string;
  cloudinary_public_id: string;
  file_type: string;
  mime_type: string | null;
  file_size: number;
  file_extension: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  is_default: boolean;
  variables: Array<{ name: string; placeholder?: string }>;
  use_count: number;
  last_used_at: string | null;
  version: number;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateStats {
  total: number;
  active: number;
  total_uses: number;
  by_category: Record<string, number>;
}

interface TemplatesTableProps {
  onTemplateSelect?: (template: TemplateRecord) => void;
  selectedTemplate?: TemplateRecord | null;
  onAddTemplate?: () => void;
  refreshKey?: number;
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

const fileTypeIcons: Record<string, string> = {
  document: "📄",
  spreadsheet: "📊",
  presentation: "📽️",
  pdf: "📕",
  image: "🖼️",
  other: "📁",
};

export const TemplatesTable: React.FC<TemplatesTableProps> = ({
  onTemplateSelect,
  selectedTemplate,
  onAddTemplate,
  refreshKey = 0,
}) => {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      params.append("is_active", "true");

      const res = await fetch(`/api/documents/templates?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch templates");
      }

      setTemplates(data.templates || []);
      setStats(data.stats || null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, refreshKey]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/templates/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete template");
      }

      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUseTemplate = async (template: TemplateRecord, e: React.MouseEvent) => {
    e.stopPropagation();

    // Increment use count
    try {
      await fetch(`/api/documents/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use" }),
      });
    } catch {
      // Ignore errors for use tracking
    }

    // Open template file
    window.open(template.file_url, "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
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
          onClick={fetchTemplates}
          className="mt-2 text-sm text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  const categories = ["all", "contracts", "proposals", "finance", "events", "reports", "hr", "marketing", "general"];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Templates</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Uses</p>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.total_uses}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {Object.values(stats.by_category).filter((v) => v > 0).length}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Templates</h3>
            <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-400">
              {templates.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : ""}`}
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-800" : ""}`}
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {onAddTemplate && (
              <button
                onClick={onAddTemplate}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Template
              </button>
            )}
          </div>
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
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {cat === "all" ? "All" : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-1">
                No templates found
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by uploading your first template"}
              </p>
              {onAddTemplate && !searchQuery && categoryFilter === "all" && (
                <button
                  onClick={onAddTemplate}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload Template
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => onTemplateSelect?.(template)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20 text-2xl">
                      {fileTypeIcons[template.file_type] || "📁"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 dark:text-white/90 truncate">
                        {template.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge size="sm" color={categoryColors[template.category] || "light"}>
                          {categoryLabels[template.category] || template.category}
                        </Badge>
                        {template.is_default && (
                          <Badge size="sm" color="primary">Default</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{template.use_count} uses</span>
                    <span>{formatFileSize(template.file_size)}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-400">v{template.version}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleUseTemplate(template, e)}
                        className="px-3 py-1 text-sm font-medium text-brand-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                      >
                        Use
                      </button>
                      <button
                        onClick={(e) => handleDelete(template.id, e)}
                        disabled={deletingId === template.id}
                        className="p-1 text-gray-400 hover:text-error-500"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Template</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Uses</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Used</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Size</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {templates.map((template) => (
                    <tr
                      key={template.id}
                      onClick={() => onTemplateSelect?.(template)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        selectedTemplate?.id === template.id ? "bg-brand-50 dark:bg-brand-500/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{fileTypeIcons[template.file_type] || "📁"}</span>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white/90">{template.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">v{template.version}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge size="sm" color={categoryColors[template.category] || "light"}>
                          {categoryLabels[template.category] || template.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{template.use_count}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(template.last_used_at)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatFileSize(template.file_size)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleUseTemplate(template, e)}
                            className="px-3 py-1 text-sm font-medium text-brand-500 hover:text-brand-600"
                          >
                            Use
                          </button>
                          <button
                            onClick={(e) => handleDelete(template.id, e)}
                            disabled={deletingId === template.id}
                            className="p-1 text-gray-400 hover:text-error-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
