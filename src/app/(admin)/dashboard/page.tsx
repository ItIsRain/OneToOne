"use client";
import React, { useState, useCallback } from "react";
import {
  DashboardMetrics,
  DashboardActivity,
  DashboardAnnouncements,
  DashboardGoals,
  DashboardUpcoming,
  DashboardBookmarks,
  DashboardQuickActions,
} from "@/components/agency";
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

export default function Dashboard() {
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

  // Refresh key for components
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

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

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back! Here&apos;s an overview of your agency.
          </p>
        </div>

        {/* Metrics Row */}
        <DashboardMetrics key={`metrics-${refreshKey}`} />

        {/* Quick Actions */}
        <DashboardQuickActions />

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Activity & Upcoming */}
          <div className="col-span-12 xl:col-span-8 space-y-6">
            <DashboardActivity key={`activity-${refreshKey}`} />
            <DashboardUpcoming key={`upcoming-${refreshKey}`} />
          </div>

          {/* Right Column - Announcements, Goals, Bookmarks */}
          <div className="col-span-12 xl:col-span-4 space-y-6">
            <DashboardAnnouncements
              key={`announcements-${refreshKey}`}
              onAdd={handleAddAnnouncement}
              onView={handleViewAnnouncement}
            />
            <DashboardGoals
              key={`goals-${refreshKey}`}
              onAdd={handleAddGoal}
              onView={handleViewGoal}
            />
            <DashboardBookmarks
              key={`bookmarks-${refreshKey}`}
              onAdd={handleAddBookmark}
            />
          </div>
        </div>
      </div>

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
    </>
  );
}
