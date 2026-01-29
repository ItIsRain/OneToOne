"use client";

import React from "react";
import { widgetRegistry } from "@/lib/dashboard/widgetRegistry";

interface DashboardSettings {
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

// Mini content hints per widget type
function WidgetMiniContent({ widgetKey }: { widgetKey: string }) {
  switch (widgetKey) {
    case "greeting":
      return (
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="space-y-0.5">
            <div className="h-1.5 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-1 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      );
    case "metrics":
      return (
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      );
    case "quick_actions":
      return (
        <div className="mt-1.5 flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      );
    case "onboarding":
      return (
        <div className="mt-1.5 space-y-0.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      );
    case "activity":
      return (
        <div className="mt-1.5 space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
              <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      );
    case "upcoming":
      return (
        <div className="mt-1.5 space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      );
    case "announcements":
      return (
        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-1 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      );
    case "goals":
      return (
        <div className="mt-1.5 space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gray-300 dark:bg-gray-600 rounded-full" style={{ width: `${40 + i * 20}%` }} />
            </div>
          ))}
        </div>
      );
    case "bookmarks":
      return (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      );
    default:
      return null;
  }
}

// Icons per widget type
function WidgetIcon({ widgetKey }: { widgetKey: string }) {
  const iconClass = "w-3 h-3 text-gray-400";
  switch (widgetKey) {
    case "greeting":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
    case "metrics":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "quick_actions":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "onboarding":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "activity":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "upcoming":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "announcements":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      );
    case "goals":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case "bookmarks":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      );
    default:
      return null;
  }
}

function WidgetBlock({ widgetKey, label, visible }: { widgetKey: string; label: string; visible: boolean }) {
  return (
    <div
      className={`rounded-lg p-2.5 border transition-all ${
        visible
          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
          : "border-dashed border-gray-300 dark:border-gray-700 opacity-30"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <WidgetIcon widgetKey={widgetKey} />
        <span className={`text-[11px] font-medium text-gray-600 dark:text-gray-400 ${!visible ? "line-through" : ""}`}>
          {label}
        </span>
        {!visible && (
          <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-auto">Hidden</span>
        )}
      </div>
      {visible && <WidgetMiniContent widgetKey={widgetKey} />}
    </div>
  );
}

export function DashboardPreview({ settings }: { settings: DashboardSettings }) {
  const orderedWidgets = settings.widget_order
    .map((key) => {
      const widget = widgetRegistry.find((w) => w.key === key);
      if (!widget) return null;
      const field = visibilityKeys[key];
      const visible = field ? (settings[field] as boolean) : true;
      return { ...widget, visible };
    })
    .filter(Boolean) as (typeof widgetRegistry[number] & { visible: boolean })[];

  const fullWidgets = orderedWidgets.filter((w) => w.column === "full");
  const leftWidgets = orderedWidgets.filter((w) => w.column === "left");
  const rightWidgets = orderedWidgets.filter((w) => w.column === "right");

  return (
    <div className="sticky top-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Live Preview
      </h3>
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        {/* Mini header bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded mx-6" />
        </div>

        {/* Dashboard content */}
        <div className="p-3 space-y-2">
          {/* Banner image */}
          {settings.banner_image_url && (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.banner_image_url}
                alt="Banner"
                className="w-full h-12 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Banner message */}
          {settings.banner_message && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2.5 py-1.5">
              <p className="text-[10px] text-blue-700 dark:text-blue-300 truncate">
                {settings.banner_message}
              </p>
            </div>
          )}

          {/* Full-width widgets */}
          {fullWidgets.map((w) => (
            <WidgetBlock key={w.key} widgetKey={w.key} label={w.label} visible={w.visible} />
          ))}

          {/* Two-column area */}
          {(leftWidgets.length > 0 || rightWidgets.length > 0) && (
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-8 space-y-2">
                {leftWidgets.map((w) => (
                  <WidgetBlock key={w.key} widgetKey={w.key} label={w.label} visible={w.visible} />
                ))}
              </div>
              <div className="col-span-4 space-y-2">
                {rightWidgets.map((w) => (
                  <WidgetBlock key={w.key} widgetKey={w.key} label={w.label} visible={w.visible} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
