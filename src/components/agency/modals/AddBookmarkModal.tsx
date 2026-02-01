"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface Bookmark {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string;
  url: string | null;
  icon: string | null;
  color: string | null;
  folder: string | null;
  notes: string | null;
}

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: Bookmark) => void;
}

const entityTypes = [
  { value: "page", label: "Dashboard Page" },
  { value: "url", label: "External URL" },
  { value: "client", label: "Client" },
  { value: "project", label: "Project" },
  { value: "task", label: "Task" },
  { value: "invoice", label: "Invoice" },
  { value: "event", label: "Event" },
  { value: "file", label: "File" },
  { value: "folder", label: "Folder" },
];

const dashboardPages = [
  { value: "/dashboard", label: "Dashboard Home" },
  { value: "/dashboard/crm/clients", label: "Clients" },
  { value: "/dashboard/crm/leads", label: "Leads" },
  { value: "/dashboard/projects", label: "Projects" },
  { value: "/dashboard/tasks", label: "Tasks" },
  { value: "/dashboard/events", label: "Events" },
  { value: "/dashboard/finance/invoices", label: "Invoices" },
  { value: "/dashboard/finance/payments", label: "Payments" },
  { value: "/dashboard/finance/expenses", label: "Expenses" },
  { value: "/dashboard/team", label: "Team Members" },
  { value: "/dashboard/team/time-tracking", label: "Time Tracking" },
  { value: "/dashboard/team/payroll", label: "Payroll" },
  { value: "/dashboard/documents", label: "Documents" },
  { value: "/dashboard/reports", label: "Reports" },
  { value: "/dashboard/settings", label: "Settings" },
];

const colorOptions = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

const iconOptions = ["⭐", "📌", "💼", "📊", "📁", "📋", "💰", "👥", "📅", "🔧"];

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    entity_type: "page",
    entity_name: "",
    url: "",
    entity_id: "",
    icon: "",
    color: "#3B82F6",
    folder: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        entity_type: "page",
        entity_name: "",
        url: "",
        entity_id: "",
        icon: "",
        color: "#3B82F6",
        folder: "",
        notes: "",
      });
      setError("");
      setShowOptionalFields(false);
    }
  }, [isOpen]);

  const handlePageSelect = (pageUrl: string) => {
    const page = dashboardPages.find((p) => p.value === pageUrl);
    if (page) {
      setFormData({
        ...formData,
        url: pageUrl,
        entity_name: page.label,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entity_name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.entity_type === "url" && !formData.url.trim()) {
      setError("URL is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const body = {
        entity_type: formData.entity_type,
        entity_name: formData.entity_name,
        url: formData.url || null,
        entity_id: formData.entity_id || null,
        icon: formData.icon || null,
        color: formData.color || null,
        folder: formData.folder || null,
        notes: formData.notes || null,
      };

      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save bookmark");
        return;
      }

      onSave(data.bookmark);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add Bookmark
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add a quick access link to your dashboard
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type */}
        <div>
          <Label htmlFor="entity_type">Type</Label>
          <select
            id="entity_type"
            value={formData.entity_type}
            onChange={(e) => setFormData({ ...formData, entity_type: e.target.value, url: "", entity_name: "" })}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {entityTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dashboard Page Selector */}
        {formData.entity_type === "page" && (
          <div>
            <Label htmlFor="page_select">Select Page</Label>
            <select
              id="page_select"
              value={formData.url}
              onChange={(e) => handlePageSelect(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select a page...</option>
              {dashboardPages.map((page) => (
                <option key={page.value} value={page.value}>
                  {page.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* URL Input */}
        {formData.entity_type === "url" && (
          <div>
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>
        )}

        {/* Name */}
        <div>
          <Label htmlFor="entity_name">Name *</Label>
          <Input
            id="entity_name"
            type="text"
            placeholder="Bookmark name"
            value={formData.entity_name}
            onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
          />
        </div>

        {/* Entity ID (for specific items) */}
        {!["page", "url"].includes(formData.entity_type) && (
          <div>
            <Label htmlFor="entity_id">Item ID</Label>
            <Input
              id="entity_id"
              type="text"
              placeholder="Paste the item ID here"
              value={formData.entity_id}
              onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You can find the ID in the item&apos;s URL or details
            </p>
          </div>
        )}

        {/* Color & Icon */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? "border-gray-800 dark:border-white scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: formData.icon === icon ? "" : icon })}
                  className={`w-7 h-7 rounded-lg border text-sm flex items-center justify-center transition-all ${
                    formData.icon === icon
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Optional Fields */}
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showOptionalFields ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showOptionalFields ? "Hide" : "Show"} additional options
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-5 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Folder */}
            <div>
              <Label htmlFor="folder">Folder (Group)</Label>
              <Input
                id="folder"
                type="text"
                placeholder="e.g., Work, Personal"
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                placeholder="Add notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Add Bookmark"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
