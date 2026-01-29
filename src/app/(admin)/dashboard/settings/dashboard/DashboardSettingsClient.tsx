"use client";

import React, { useEffect, useState, useRef } from "react";
import { widgetRegistry } from "@/lib/dashboard/widgetRegistry";
import { DashboardPreview } from "@/components/agency/dashboard/DashboardPreview";

interface DashboardSettings {
  id: string | null;
  show_greeting: boolean;
  show_metrics: boolean;
  show_quick_actions: boolean;
  show_onboarding: boolean;
  show_activity: boolean;
  show_upcoming: boolean;
  show_announcements: boolean;
  show_goals: boolean;
  show_bookmarks: boolean;
  widget_order: string[];
  accent_color: string | null;
  banner_image_url: string | null;
  banner_message: string | null;
}

const visibilityKeys: Record<string, keyof DashboardSettings> = {
  greeting: "show_greeting",
  metrics: "show_metrics",
  quick_actions: "show_quick_actions",
  onboarding: "show_onboarding",
  activity: "show_activity",
  upcoming: "show_upcoming",
  announcements: "show_announcements",
  goals: "show_goals",
  bookmarks: "show_bookmarks",
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-8">
      {/* Left: Controls */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              Dashboard settings saved successfully.
            </p>
          </div>
        )}

        {/* Widget Toggles & Reorder */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Widgets
          </h3>
          <div className="space-y-2">
            {settings.widget_order.map((key, index) => {
              const widget = widgetRegistry.find((w) => w.key === key);
              if (!widget) return null;
              const field = visibilityKeys[key];
              const isVisible = field ? (settings[field] as boolean) : true;

              return (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
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

                  <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {widget.label}
                  </span>

                  <span className="text-xs text-gray-400 capitalize">{widget.column}</span>

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
                      disabled={index === settings.widget_order.length - 1}
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
            value={settings.banner_message || ""}
            onChange={(e) => setSettings({ ...settings, banner_message: e.target.value || null })}
            placeholder="Optional message shown at top of dashboard"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Banner Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Banner Image
          </label>
          {settings.banner_image_url ? (
            <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
              className="w-full h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-6 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
