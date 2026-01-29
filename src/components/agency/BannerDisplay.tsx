"use client";

import React, { useEffect, useState, useCallback } from "react";

interface BannerNotification {
  id: string;
  title: string;
  message: string;
  metadata?: {
    banner_type?: "info" | "success" | "warning" | "error";
    dismiss_after?: number;
  };
  created_at: string;
}

const BANNER_STYLES: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-900 dark:text-blue-100",
  },
  success: {
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    text: "text-green-900 dark:text-green-100",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-900 dark:text-amber-100",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    text: "text-red-900 dark:text-red-100",
  },
};

const BANNER_ICONS: Record<string, React.ReactNode> = {
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Dashboard settings banner (simple message + optional image)
interface DashboardBannerProps {
  message: string;
  imageUrl?: string | null;
}

export function DashboardBanner({ message, imageUrl }: DashboardBannerProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-5 md:p-6"
      style={{
        background: imageUrl
          ? undefined
          : "linear-gradient(135deg, rgb(var(--color-brand-500) / 0.1), rgb(var(--color-brand-500) / 0.03))",
      }}
    >
      {imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}
      <p
        className={`relative text-sm font-medium ${
          imageUrl ? "text-white" : "text-gray-800 dark:text-white/90"
        }`}
      >
        {message}
      </p>
    </div>
  );
}

// Notification banners (existing)
export default function BannerDisplay() {
  const [banners, setBanners] = useState<BannerNotification[]>([]);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?type=banner&read=false&limit=5");
      if (!res.ok) return;
      const data = await res.json();
      setBanners(data.notifications || []);
    } catch {
      // Silently fail - banners are non-critical
    }
  }, []);

  useEffect(() => {
    fetchBanners();
    // Poll every 30 seconds for new banners
    const interval = setInterval(fetchBanners, 30000);
    return () => clearInterval(interval);
  }, [fetchBanners]);

  const dismissBanner = async (id: string) => {
    // Optimistically remove from UI
    setBanners((prev) => prev.filter((b) => b.id !== id));
    // Mark as read
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      // Ignore
    }
  };

  // Auto-dismiss banners with dismiss_after set
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    banners.forEach((banner) => {
      const dismissAfter = banner.metadata?.dismiss_after;
      if (dismissAfter && dismissAfter > 0) {
        const timer = setTimeout(() => {
          dismissBanner(banner.id);
        }, dismissAfter * 1000);
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners]);

  if (banners.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {banners.map((banner) => {
        const bannerType = banner.metadata?.banner_type || "info";
        const style = BANNER_STYLES[bannerType] || BANNER_STYLES.info;
        const icon = BANNER_ICONS[bannerType] || BANNER_ICONS.info;

        return (
          <div
            key={banner.id}
            className={`${style.bg} ${style.border} border rounded-lg px-4 py-3 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300`}
          >
            <span className={`${style.icon} mt-0.5 shrink-0`}>{icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`${style.text} font-medium text-sm`}>{banner.title}</p>
              {banner.message && (
                <p className={`${style.text} text-sm opacity-80 mt-0.5`}>{banner.message}</p>
              )}
            </div>
            <button
              onClick={() => dismissBanner(banner.id)}
              className={`${style.icon} hover:opacity-70 shrink-0 mt-0.5`}
              aria-label="Dismiss banner"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
