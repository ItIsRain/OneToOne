"use client";

import React, { useState, useRef } from "react";
import { widgetRegistry } from "@/lib/dashboard/widgetRegistry";

export interface DashboardSettings {
  show_greeting: boolean;
  show_briefing: boolean;
  show_metrics: boolean;
  show_quick_actions: boolean;
  show_onboarding: boolean;
  show_activity: boolean;
  show_upcoming: boolean;
  show_announcements: boolean;
  show_goals: boolean;
  show_bookmarks: boolean;
  show_scope_creep: boolean;
  show_client_health: boolean;
  show_resource_heatmap: boolean;
  show_client_journey: boolean;
  widget_order: string[];
  accent_color: string | null;
  banner_image_url: string | null;
  banner_message: string | null;
}

interface DashboardCustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  onSave: (settings: DashboardSettings) => void;
  saving?: boolean;
}

const visibilityKeys: Record<string, keyof DashboardSettings> = {
  greeting: "show_greeting",
  briefing: "show_briefing",
  metrics: "show_metrics",
  quick_actions: "show_quick_actions",
  onboarding: "show_onboarding",
  activity: "show_activity",
  upcoming: "show_upcoming",
  announcements: "show_announcements",
  goals: "show_goals",
  bookmarks: "show_bookmarks",
  scope_creep: "show_scope_creep",
  client_health: "show_client_health",
  resource_heatmap: "show_resource_heatmap",
  client_journey: "show_client_journey",
};

export function DashboardCustomizePanel({
  isOpen,
  onClose,
  settings,
  onSave,
  saving,
}: DashboardCustomizePanelProps) {
  const [local, setLocal] = useState<DashboardSettings>(settings);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (key: string) => {
    const field = visibilityKeys[key];
    if (field) {
      setLocal((prev) => ({ ...prev, [field]: !prev[field] }));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const order = [...local.widget_order];
    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    setLocal((prev) => ({ ...prev, widget_order: order }));
  };

  const handleMoveDown = (index: number) => {
    if (index >= local.widget_order.length - 1) return;
    const order = [...local.widget_order];
    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    setLocal((prev) => ({ ...prev, widget_order: order }));
  };

  const handleSave = () => {
    onSave(local);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[380px] max-w-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Customize Dashboard
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Widget Toggles & Reorder */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Widgets
            </h3>
            <div className="space-y-2">
              {local.widget_order.map((key, index) => {
                const widget = widgetRegistry.find((w) => w.key === key);
                if (!widget) return null;
                const field = visibilityKeys[key];
                const isVisible = field ? (local[field] as boolean) : true;

                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        isVisible ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                          isVisible ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>

                    {/* Label */}
                    <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {widget.label}
                    </span>

                    {/* Reorder buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === local.widget_order.length - 1}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Banner Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Banner Message
            </label>
            <input
              type="text"
              value={local.banner_message || ""}
              onChange={(e) => setLocal((prev) => ({ ...prev, banner_message: e.target.value || null }))}
              placeholder="Optional message shown at top of dashboard"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Banner Image
            </label>
            {local.banner_image_url ? (
              <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={local.banner_image_url}
                  alt="Banner preview"
                  className="w-full h-24 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={bannerUploading}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocal((prev) => ({ ...prev, banner_image_url: null }));
                      setBannerError("");
                      if (bannerInputRef.current) bannerInputRef.current.value = "";
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bannerUploading ? (
                  <>
                    <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Click to upload
                    </span>
                  </>
                )}
              </button>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  setBannerError("File size must be less than 10 MB");
                  return;
                }
                if (!file.type.startsWith("image/")) {
                  setBannerError("Please select an image file");
                  return;
                }
                setBannerUploading(true);
                setBannerError("");
                try {
                  const reader = new FileReader();
                  const base64 = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error("Failed to read file"));
                    reader.readAsDataURL(file);
                  });
                  const res = await fetch("/api/upload/portal-banner", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64 }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Upload failed");
                  setLocal((prev) => ({ ...prev, banner_image_url: data.url }));
                } catch (err) {
                  setBannerError(err instanceof Error ? err.message : "Upload failed");
                } finally {
                  setBannerUploading(false);
                  if (bannerInputRef.current) bannerInputRef.current.value = "";
                }
              }}
            />
            {bannerError && (
              <p className="mt-1 text-xs text-red-500">{bannerError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
