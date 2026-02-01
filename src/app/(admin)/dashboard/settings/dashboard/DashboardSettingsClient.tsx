"use client";

import React, { useEffect, useState, useRef } from "react";
import { widgetRegistry } from "@/lib/dashboard/widgetRegistry";
import { DashboardPreview } from "@/components/agency/dashboard/DashboardPreview";

interface DashboardSettings {
  id: string | null;
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
  show_business_health: boolean;
  widget_order: string[];
  accent_color: string | null;
  banner_image_url: string | null;
  banner_message: string | null;
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
  business_health: "show_business_health",
};

const widgetDescriptions: Record<string, string> = {
  greeting: "Personalized welcome message with date & time",
  briefing: "AI-powered daily summary of tasks, meetings & priorities",
  metrics: "Key business metrics at a glance",
  quick_actions: "Shortcuts to common actions",
  onboarding: "Setup checklist for new users",
  activity: "Recent events across your workspace",
  upcoming: "Scheduled meetings and deadlines this week",
  client_health: "Client satisfaction and risk indicators",
  announcements: "Team announcements and updates",
  goals: "Track goals and key performance indicators",
  bookmarks: "Quick links to frequently used pages",
  scope_creep: "Alerts for projects exceeding original scope",
  resource_heatmap: "Visual team capacity and utilization overview",
  client_journey: "Client lifecycle stages and progress timeline",
  business_health: "Composite health score across financial, operational & growth metrics",
};

const widgetIcons: Record<string, React.ReactNode> = {
  greeting: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 01.198-.471 1.575 1.575 0 10-2.228-2.228 3.818 3.818 0 00-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0116.35 15m.002 0h-.002" />
    </svg>
  ),
  briefing: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  ),
  metrics: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  quick_actions: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  onboarding: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  upcoming: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  client_health: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  announcements: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  ),
  goals: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  ),
  bookmarks: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  ),
  scope_creep: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  resource_heatmap: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  client_journey: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0l3-3m-3 3l-3-3m12-3V15m0 0l3-3m-3 3l-3-3" />
    </svg>
  ),
  business_health: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
};

const columnLabels: Record<string, { label: string; color: string }> = {
  full: { label: "Full Width", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  left: { label: "Left Column", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  right: { label: "Right Column", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export default function DashboardSettingsClient() {
  const [settings, setSettings] = useState<DashboardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/settings/dashboard");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await fetch("/api/settings/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      const data = await res.json();
      setSettings(data.settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const handleToggle = (key: string) => {
    if (!settings) return;
    const field = visibilityKeys[key];
    if (field) {
      setSettings({ ...settings, [field]: !settings[field] });
    }
  };

  const handleMoveUp = (index: number) => {
    if (!settings || index === 0) return;
    const order = [...settings.widget_order];
    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    setSettings({ ...settings, widget_order: order });
  };

  const handleMoveDown = (index: number) => {
    if (!settings || index >= settings.widget_order.length - 1) return;
    const order = [...settings.widget_order];
    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    setSettings({ ...settings, widget_order: order });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

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

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSettings({ ...settings, banner_image_url: data.url });
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleBannerRemove = () => {
    if (!settings) return;
    setSettings({ ...settings, banner_image_url: null });
    setBannerError("");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!settings) return null;

  // Group widgets by column type for display
  const groupedWidgets = {
    full: settings.widget_order.filter((key) => {
      const w = widgetRegistry.find((wr) => wr.key === key);
      return w?.column === "full";
    }),
    left: settings.widget_order.filter((key) => {
      const w = widgetRegistry.find((wr) => wr.key === key);
      return w?.column === "left";
    }),
    right: settings.widget_order.filter((key) => {
      const w = widgetRegistry.find((wr) => wr.key === key);
      return w?.column === "right";
    }),
  };

  const enabledCount = settings.widget_order.filter((key) => {
    const field = visibilityKeys[key];
    return field ? (settings[field] as boolean) : true;
  }).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-8">
      {/* Left: Controls */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-sm text-green-600 dark:text-green-400">
              Dashboard settings saved successfully.
            </p>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {enabledCount} of {settings.widget_order.length} widgets enabled
            </span>
          </div>
        </div>

        {/* Widget Groups */}
        {(["full", "left", "right"] as const).map((colType) => {
          const widgets = groupedWidgets[colType];
          if (widgets.length === 0) return null;
          const colInfo = columnLabels[colType];

          return (
            <div key={colType}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${colInfo.color}`}>
                  {colInfo.label}
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {widgets.length} widget{widgets.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2">
                {widgets.map((key) => {
                  const globalIndex = settings.widget_order.indexOf(key);
                  const widget = widgetRegistry.find((w) => w.key === key);
                  if (!widget) return null;
                  const field = visibilityKeys[key];
                  const isVisible = field ? (settings[field] as boolean) : true;

                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                        isVisible
                          ? "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 shadow-sm"
                          : "bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800/50 opacity-60"
                      }`}
                    >
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggle(key)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors mt-0.5 ${
                          isVisible ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            isVisible ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>

                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${
                        isVisible
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                      }`}>
                        {widgetIcons[key] || (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        )}
                      </div>

                      {/* Label & description */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {widget.label}
                        </span>
                        {widgetDescriptions[key] && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
                            {widgetDescriptions[key]}
                          </p>
                        )}
                      </div>

                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleMoveUp(globalIndex)}
                          disabled={globalIndex === 0}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveDown(globalIndex)}
                          disabled={globalIndex === settings.widget_order.length - 1}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Banner Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Banner Message
          </label>
          <input
            type="text"
            value={settings.banner_message || ""}
            onChange={(e) => setSettings({ ...settings, banner_message: e.target.value || null })}
            placeholder="Optional message shown at top of dashboard"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Banner Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Banner Image
          </label>
          {settings.banner_image_url ? (
            <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.banner_image_url}
                alt="Banner preview"
                className="w-full h-32 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleBannerRemove}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
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
              className="w-full h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bannerUploading ? (
                <>
                  <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Click to upload banner image
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    PNG, JPG, WEBP &middot; Max 10 MB
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
            onChange={handleBannerUpload}
          />
          {bannerError && (
            <p className="mt-1.5 text-sm text-red-500">{bannerError}</p>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="hidden xl:block">
        <DashboardPreview settings={settings} />
      </div>
    </div>
  );
}
