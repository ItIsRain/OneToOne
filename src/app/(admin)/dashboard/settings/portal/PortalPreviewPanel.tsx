"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import TenantPortalLanding from "@/components/portal/TenantPortalLanding";
import type { PortalSettings } from "@/types/portal";

interface PortalPreviewPanelProps {
  settings: PortalSettings;
  tenantName: string;
  primaryColor: string;
}

const mockEvents = [
  {
    id: "preview-1",
    title: "Annual Community Gala",
    slug: "annual-community-gala",
    description: "Join us for an evening of celebration.",
    start_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    end_date: null,
    location: "Grand Ballroom",
    is_virtual: false,
    cover_image: null,
    category: "Social",
    event_type: null,
  },
  {
    id: "preview-2",
    title: "Workshop: Getting Started",
    slug: "workshop-getting-started",
    description: "Learn the fundamentals.",
    start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    end_date: null,
    location: null,
    is_virtual: true,
    cover_image: null,
    category: "Workshop",
    event_type: null,
  },
  {
    id: "preview-3",
    title: "Networking Mixer",
    slug: "networking-mixer",
    description: "Connect with peers.",
    start_date: new Date(Date.now() + 21 * 86400000).toISOString(),
    end_date: null,
    location: "Rooftop Lounge",
    is_virtual: false,
    cover_image: null,
    category: "Networking",
    event_type: null,
  },
];

export default function PortalPreviewPanel({
  settings,
  tenantName,
  primaryColor,
}: PortalPreviewPanelProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const designWidth = viewMode === "desktop" ? 1440 : 390;
  const scale = containerWidth > 0 ? containerWidth / designWidth : 0;

  // Measure container width
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Measure content height
  const measureContent = useCallback(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    measureContent();
    // Re-measure when settings change
    const timer = setTimeout(measureContent, 100);
    return () => clearTimeout(timer);
  }, [settings, viewMode, measureContent]);

  // Also observe content size changes
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setContentHeight(el.scrollHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const portalSettings = useMemo(() => ({ ...settings }), [settings]);

  const scaledHeight = contentHeight * scale;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg flex-shrink-0">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Live Preview</span>
        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("desktop")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "desktop"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "mobile"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview scroll container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-gray-900/50 rounded-b-lg"
      >
        {scale > 0 && (
          <div
            style={{
              width: `${containerWidth}px`,
              height: scaledHeight > 0 ? `${scaledHeight}px` : "auto",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              ref={contentRef}
              style={{
                width: `${designWidth}px`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <TenantPortalLanding
                tenantName={tenantName}
                logoUrl={null}
                primaryColor={primaryColor}
                portalSettings={portalSettings}
                upcomingEvents={mockEvents}
                previewMode
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
