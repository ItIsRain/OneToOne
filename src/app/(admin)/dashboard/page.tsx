"use client";
import React, { useState, useCallback, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
import {
  DashboardMetrics,
  DashboardActivity,
  DashboardAnnouncements,
  DashboardGoals,
  DashboardUpcoming,
  DashboardBookmarks,
  DashboardQuickActions,
  MorningBriefing,
} from "@/components/agency";
import { WelcomeModal, DashboardOnboarding, DashboardGreeting, ScopeCreepWidget, AgencyCommandCenter, ClientHealthWidget, ResourceHeatmap, ClientJourneyMap, BusinessHealthScore } from "@/components/agency/dashboard";
import type { Announcement, Goal } from "@/components/agency/dashboard";
import {
  AddAnnouncementModal,
  AddGoalModal,
  AddBookmarkModal,
} from "@/components/agency/modals";
import {
  AnnouncementDetailsSidebar,
  GoalDetailsSidebar,
} from "@/components/agency/sidebars";
import { DashboardCustomizePanel, type DashboardSettings } from "@/components/agency/dashboard/DashboardCustomizePanel";
import { widgetRegistry } from "@/lib/dashboard/widgetRegistry";
import { DashboardBanner } from "@/components/agency/BannerDisplay";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";

const defaultSettings: DashboardSettings = {
  show_greeting: true,
  show_briefing: true,
  show_metrics: true,
  show_quick_actions: true,
  show_onboarding: true,
  show_activity: true,
  show_upcoming: true,
  show_announcements: true,
  show_goals: true,
  show_bookmarks: true,
  show_scope_creep: true,
  show_client_health: true,
  show_resource_heatmap: true,
  show_client_journey: true,
  show_business_health: true,
  widget_order: ["greeting", "briefing", "metrics", "quick_actions", "onboarding", "resource_heatmap", "client_journey", "business_health", "activity", "upcoming", "client_health", "announcements", "goals", "bookmarks", "scope_creep"],
  accent_color: null,
  banner_image_url: null,
  banner_message: null,
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function DashboardContent() {
  const { data, isLoading, error, refresh } = useDashboard();

  // Dashboard settings - use from context or defaults
  const dashSettings = useMemo(() => {
    if (data?.settings) {
      const saved = data.settings;
      const merged = { ...defaultSettings, ...saved };
      // Ensure any new widgets missing from saved widget_order are appended
      const savedOrder: string[] = saved.widget_order || [];
      const allKeys = defaultSettings.widget_order;
      const missingKeys = allKeys.filter((k: string) => !savedOrder.includes(k));
      if (missingKeys.length > 0) {
        merged.widget_order = [...savedOrder, ...missingKeys];
      }
      return merged;
    }
    return defaultSettings;
  }, [data?.settings]);

  const [localSettings, setLocalSettings] = useState<DashboardSettings | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Use local settings if available (after save), otherwise use context settings
  const activeSettings = localSettings || dashSettings;

  // Announcement state
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [announcementSidebarOpen, setAnnouncementSidebarOpen] = useState(false);

  // Goal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
  const [goalSidebarOpen, setGoalSidebarOpen] = useState(false);

  // Bookmark state
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

  // Refresh key for components that need independent refresh
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaveSettings = useCallback(async (newSettings: DashboardSettings) => {
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const res = await fetch("/api/settings/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const result = await res.json();
        setLocalSettings(result.settings);
        setCustomizeOpen(false);
        // Refresh dashboard data to get updated settings
        refresh();
      } else {
        setSettingsError("Failed to save dashboard settings. Please try again.");
      }
    } catch (err) {
      console.error("Dashboard settings save error:", err);
      setSettingsError("Failed to save dashboard settings. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  }, [refresh]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    refresh();
  }, [refresh]);

  // Announcement handlers
  const handleAddAnnouncement = useCallback(() => {
    setEditingAnnouncement(null);
    setIsAnnouncementModalOpen(true);
  }, []);

  const handleViewAnnouncement = useCallback((announcement: Announcement) => {
    setViewingAnnouncement(announcement);
    setAnnouncementSidebarOpen(true);
  }, []);

  const handleEditAnnouncement = useCallback((announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsAnnouncementModalOpen(true);
    setAnnouncementSidebarOpen(false);
  }, []);

  const handleAnnouncementSaved = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleAnnouncementDeleted = useCallback(() => {
    setAnnouncementSidebarOpen(false);
    handleRefresh();
  }, [handleRefresh]);

  // Goal handlers
  const handleAddGoal = useCallback(() => {
    setEditingGoal(null);
    setIsGoalModalOpen(true);
  }, []);

  const handleViewGoal = useCallback((goal: Goal) => {
    setViewingGoal(goal);
    setGoalSidebarOpen(true);
  }, []);

  const handleEditGoal = useCallback((goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
    setGoalSidebarOpen(false);
  }, []);

  const handleGoalSaved = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleGoalDeleted = useCallback(() => {
    setGoalSidebarOpen(false);
    handleRefresh();
  }, [handleRefresh]);

  const handleGoalProgressUpdated = useCallback((updatedGoal: Goal) => {
    setViewingGoal(updatedGoal);
    handleRefresh();
  }, [handleRefresh]);

  // Bookmark handlers
  const handleAddBookmark = useCallback(() => {
    setIsBookmarkModalOpen(true);
  }, []);

  const handleBookmarkSaved = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Determine visibility
  const isVisible = useCallback((key: string) => {
    const visMap: Record<string, boolean> = {
      greeting: activeSettings.show_greeting,
      briefing: activeSettings.show_briefing,
      metrics: activeSettings.show_metrics,
      quick_actions: activeSettings.show_quick_actions,
      onboarding: activeSettings.show_onboarding,
      activity: activeSettings.show_activity,
      upcoming: activeSettings.show_upcoming,
      announcements: activeSettings.show_announcements,
      goals: activeSettings.show_goals,
      bookmarks: activeSettings.show_bookmarks,
      scope_creep: activeSettings.show_scope_creep,
      client_health: activeSettings.show_client_health,
      resource_heatmap: activeSettings.show_resource_heatmap,
      client_journey: activeSettings.show_client_journey,
      business_health: activeSettings.show_business_health,
    };
    return visMap[key] !== false;
  }, [activeSettings]);

  // Render a widget by key - pass data from context where available
  const renderWidget = useCallback((key: string) => {
    if (!isVisible(key)) return null;
    switch (key) {
      case "greeting":
        return (
          <DashboardGreeting
            key="greeting"
            firstName={data?.user?.firstName}
            overdueTasks={data?.metrics?.overdueTasks || 0}
            todayEvents={data?.briefing?.todaySchedule?.length || 0}
            unpaidInvoices={data?.metrics?.overdueInvoices || 0}
            isLoading={isLoading}
          />
        );
      case "briefing":
        return <MorningBriefing key={`briefing-${refreshKey}`} data={data?.briefing} isLoading={isLoading} />;
      case "metrics":
        return <DashboardMetrics key={`metrics-${refreshKey}`} data={data?.metrics} isLoading={isLoading} />;
      case "quick_actions":
        return <DashboardQuickActions key="quick_actions" />;
      case "onboarding":
        return <DashboardOnboarding key="onboarding" />;
      case "resource_heatmap":
        return <ResourceHeatmap key={`resource_heatmap-${refreshKey}`} />;
      case "client_journey":
        return <ClientJourneyMap key={`client_journey-${refreshKey}`} />;
      case "business_health":
        return <BusinessHealthScore key={`business_health-${refreshKey}`} />;
      default:
        return null;
    }
  }, [isVisible, data, isLoading, refreshKey]);

  // Separate widgets by column for grid rendering
  const fullWidgets = useMemo(() =>
    activeSettings.widget_order.filter((k) => {
      const w = widgetRegistry.find((r) => r.key === k);
      return w?.column === "full" && isVisible(k);
    }), [activeSettings.widget_order, isVisible]);

  const leftWidgets = useMemo(() =>
    activeSettings.widget_order.filter((k) => {
      const w = widgetRegistry.find((r) => r.key === k);
      return w?.column === "left" && isVisible(k);
    }), [activeSettings.widget_order, isVisible]);

  const rightWidgets = useMemo(() =>
    activeSettings.widget_order.filter((k) => {
      const w = widgetRegistry.find((r) => r.key === k);
      return w?.column === "right" && isVisible(k);
    }), [activeSettings.widget_order, isVisible]);

  const renderLeftWidget = useCallback((key: string) => {
    switch (key) {
      case "activity":
        return <DashboardActivity key={`activity-${refreshKey}`} data={data?.activity} isLoading={isLoading} />;
      case "upcoming":
        return <DashboardUpcoming key={`upcoming-${refreshKey}`} data={data?.upcoming} isLoading={isLoading} />;
      case "client_health":
        return <ClientHealthWidget key={`client_health-${refreshKey}`} />;
      default:
        return null;
    }
  }, [data, isLoading, refreshKey]);

  const renderRightWidget = useCallback((key: string) => {
    switch (key) {
      case "announcements":
        return (
          <DashboardAnnouncements
            key={`announcements-${refreshKey}`}
            data={data?.announcements}
            isLoading={isLoading}
            onAdd={handleAddAnnouncement}
            onView={handleViewAnnouncement}
          />
        );
      case "goals":
        return (
          <DashboardGoals
            key={`goals-${refreshKey}`}
            data={data?.goals}
            isLoading={isLoading}
            onAdd={handleAddGoal}
            onView={handleViewGoal}
          />
        );
      case "bookmarks":
        return (
          <DashboardBookmarks
            key={`bookmarks-${refreshKey}`}
            data={data?.bookmarks}
            isLoading={isLoading}
            onAdd={handleAddBookmark}
          />
        );
      case "scope_creep":
        return <ScopeCreepWidget key={`scope_creep-${refreshKey}`} />;
      default:
        return null;
    }
  }, [data, isLoading, refreshKey, handleAddAnnouncement, handleViewAnnouncement, handleAddGoal, handleViewGoal, handleAddBookmark]);

  // Show global error if data fetch failed
  if (error && !data) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-error-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-error-800 dark:text-error-200">
              {error.message || "Failed to load dashboard"}
            </p>
            <button
              onClick={() => refresh()}
              className="mt-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Customize Button */}
        <motion.div className="flex justify-end gap-2" variants={sectionVariants}>
          <button
            onClick={() => setCommandCenterOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Command Center
          </button>
          <button
            onClick={() => setCustomizeOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Customize
          </button>
        </motion.div>

        {/* Settings Error Alert */}
        {settingsError && (
          <motion.div
            variants={sectionVariants}
            className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {settingsError}
                </p>
              </div>
              <button
                onClick={() => setSettingsError(null)}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {/* Banner */}
        {activeSettings.banner_message && (
          <motion.div variants={sectionVariants}>
            <DashboardBanner
              message={activeSettings.banner_message}
              imageUrl={activeSettings.banner_image_url}
            />
          </motion.div>
        )}

        {/* Full-width widgets */}
        {fullWidgets.map((key) => (
          <motion.div key={key} variants={sectionVariants}>
            {renderWidget(key)}
          </motion.div>
        ))}

        {/* Main Grid */}
        {(leftWidgets.length > 0 || rightWidgets.length > 0) && (
          <motion.div className="grid grid-cols-12 gap-6" variants={sectionVariants}>
            {/* Left Column */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              {leftWidgets.map((key) => (
                <div key={key}>{renderLeftWidget(key)}</div>
              ))}
            </div>

            {/* Right Column */}
            <div className="col-span-12 xl:col-span-4 space-y-6">
              {rightWidgets.map((key) => (
                <div key={key}>{renderRightWidget(key)}</div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Customize Panel */}
      <DashboardCustomizePanel
        isOpen={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        settings={activeSettings}
        onSave={handleSaveSettings}
        saving={savingSettings}
      />

      {/* Announcement Modal */}
      <AddAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => {
          setIsAnnouncementModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSave={handleAnnouncementSaved}
        announcement={editingAnnouncement}
      />

      {/* Announcement Sidebar */}
      <AnnouncementDetailsSidebar
        isOpen={announcementSidebarOpen}
        onClose={() => setAnnouncementSidebarOpen(false)}
        announcement={viewingAnnouncement}
        onEdit={handleEditAnnouncement}
        onDelete={handleAnnouncementDeleted}
      />

      {/* Goal Modal */}
      <AddGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleGoalSaved}
        goal={editingGoal}
      />

      {/* Goal Sidebar */}
      <GoalDetailsSidebar
        isOpen={goalSidebarOpen}
        onClose={() => setGoalSidebarOpen(false)}
        goal={viewingGoal}
        onEdit={handleEditGoal}
        onDelete={handleGoalDeleted}
        onUpdateProgress={handleGoalProgressUpdated}
      />

      {/* Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        onSave={handleBookmarkSaved}
      />

      {/* Welcome Modal (shows after signup with ?subscribed=true) */}
      <Suspense fallback={null}>
        <WelcomeModal />
      </Suspense>

      {/* Command Center Overlay */}
      <AgencyCommandCenter
        isOpen={commandCenterOpen}
        onClose={() => setCommandCenterOpen(false)}
      />
    </>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
