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

interface ModalNotification {
  id: string;
  title: string;
  message: string;
  metadata?: {
    banner_type?: "info" | "success" | "warning" | "error";
    show_once?: boolean;
    button_text?: string;
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

const MODAL_ACCENT: Record<string, { ring: string; iconBg: string; iconText: string; button: string }> = {
  info: {
    ring: "ring-blue-500/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconText: "text-blue-600 dark:text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  success: {
    ring: "ring-green-500/20",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    iconText: "text-green-600 dark:text-green-400",
    button: "bg-green-600 hover:bg-green-700",
  },
  warning: {
    ring: "ring-amber-500/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconText: "text-amber-600 dark:text-amber-400",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  error: {
    ring: "ring-red-500/20",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconText: "text-red-600 dark:text-red-400",
    button: "bg-red-600 hover:bg-red-700",
  },
};

const MODAL_ICONS: Record<string, React.ReactNode> = {
  info: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Notification banners + modal overlay
export default function BannerDisplay() {
  const [banners, setBanners] = useState<BannerNotification[]>([]);
  const [activeModal, setActiveModal] = useState<ModalNotification | null>(null);

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

  const fetchModal = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?type=modal&read=false&limit=1");
      if (!res.ok) return;
      const data = await res.json();
      const modals: ModalNotification[] = data.notifications || [];
      if (modals.length > 0 && !activeModal) {
        setActiveModal(modals[0]);
      }
    } catch {
      // Silently fail
    }
  }, [activeModal]);

  useEffect(() => {
    fetchBanners();
    fetchModal();
    const interval = setInterval(() => {
      fetchBanners();
      fetchModal();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchBanners, fetchModal]);

  const dismissBanner = async (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
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

  const dismissModal = async () => {
    if (!activeModal) return;
    const id = activeModal.id;
    setActiveModal(null);
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

  const modalType = activeModal?.metadata?.banner_type || "info";
  const modalAccent = MODAL_ACCENT[modalType] || MODAL_ACCENT.info;
  const modalIcon = MODAL_ICONS[modalType] || MODAL_ICONS.info;
  const buttonText = activeModal?.metadata?.button_text || "Got it";

  return (
    <>
      {/* Banner strip */}
      {banners.length > 0 && (
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
      )}

      {/* Modal overlay — shown once, center screen */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={dismissModal}
          />
          {/* Modal card */}
          <div
            className={`relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ring-1 ${modalAccent.ring} animate-in zoom-in-95 fade-in duration-300 overflow-hidden`}
          >
            <div className="p-6 text-center">
              {/* Icon */}
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${modalAccent.iconBg} mb-4`}>
                <span className={modalAccent.iconText}>{modalIcon}</span>
              </div>
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {activeModal.title}
              </h3>
              {/* Message */}
              {activeModal.message && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 whitespace-pre-wrap">
                  {activeModal.message}
                </p>
              )}
              {/* Action button */}
              <button
                onClick={dismissModal}
                className={`${modalAccent.button} text-white font-medium px-6 py-2.5 rounded-xl transition-colors w-full`}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
