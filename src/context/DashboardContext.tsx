"use client";

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from "react";
import useSWR from "swr";

// localStorage key for caching dashboard data
const DASHBOARD_CACHE_KEY = "dashboard_cache_v1";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to safely read from localStorage
function getCachedData(): DashboardData | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    // Check if cache is still fresh (within 24 hours)
    if (Date.now() - timestamp > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(DASHBOARD_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Helper to save to localStorage
function setCachedData(data: DashboardData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Ignore quota errors
  }
}

// Types
interface DashboardMetrics {
  activeClients: number;
  clientsGrowth: number;
  upcomingEvents: number;
  eventsThisWeek: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  pendingTasks: number;
  overdueTasks: number;
  activeProjects: number;
  avgProjectProgress: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  teamMembers: number;
}

interface ScheduleItem {
  id: string;
  type: "event" | "appointment";
  title: string;
  time: string;
  endTime?: string | null;
  location?: string | null;
  eventType?: string | null;
  isVirtual?: boolean;
  attendeeName?: string;
  attendeeEmail?: string;
  path: string;
}

interface TaskItem {
  id: string;
  title: string;
  priority?: string;
  dueDate?: string;
  status?: string;
  path: string;
}

interface OverdueInvoice {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  path: string;
}

interface ProposalItem {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  path: string;
}

interface LeadItem {
  id: string;
  name: string;
  company: string | null;
  status: string;
  createdAt: string;
  path: string;
}

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
  path: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string | null;
}

interface BriefingData {
  firstName: string;
  todaySchedule: ScheduleItem[];
  overdueInvoices: {
    count: number;
    totalAmount: number;
    items: OverdueInvoice[];
  };
  blockedTasks: TaskItem[];
  overdueTasks: TaskItem[];
  pipelineActivity: {
    activeProposals: ProposalItem[];
    recentLeads: LeadItem[];
  };
  upcomingDeadlines: DeadlineItem[];
  teamSnapshot: {
    totalMembers: number;
    members: TeamMember[];
  };
}

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  category: string;
  priority: string;
  is_pinned: boolean;
  is_published: boolean;
  publish_at: string | null;
  expires_at: string | null;
  views_count: number;
  reactions: Record<string, number>;
  created_at: string;
  updated_at: string;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  auto_track: boolean;
  track_entity: string | null;
  period_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  category: string | null;
  color: string;
  icon: string | null;
  milestones: Array<{ value: number; label: string; achieved_at?: string }>;
  updates: Array<{ date: string; value: number; note?: string }>;
  created_at: string;
  updated_at: string;
}

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

interface DashboardSettings {
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

interface DashboardData {
  settings: DashboardSettings | null;
  user: {
    firstName: string;
    lastName: string;
  };
  metrics: DashboardMetrics;
  activity: Activity[];
  briefing: BriefingData;
  upcoming: {
    tasks: Array<{
      id: string;
      title: string;
      due_date: string;
      priority: string;
      status: string;
      project_id: string | null;
    }>;
    events: Array<{
      id: string;
      title: string;
      start_date: string;
      end_date: string | null;
      status: string;
      event_type: string | null;
    }>;
  };
  announcements: Announcement[];
  goals: Goal[];
  bookmarks: Bookmark[];
  team: Array<{
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    role: string;
  }>;
  fetchedAt: string;
}

interface DashboardContextType {
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  mutate: (data?: DashboardData) => void;
}

const DashboardContext = createContext<DashboardContextType>({
  data: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
  mutate: () => {},
});

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Session expired. Please refresh the page.");
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch dashboard data");
  }
  return res.json();
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  // Load cached data synchronously on mount for instant display
  const [initialCache] = useState<DashboardData | null>(() => getCachedData());

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    "/api/dashboard/combined",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      focusThrottleInterval: 60000, // 1 minute
      errorRetryCount: 2,
      keepPreviousData: true,
      fallbackData: initialCache || undefined,
      onSuccess: (freshData) => {
        // Save to localStorage for next visit
        setCachedData(freshData);
      },
    }
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const handleMutate = useCallback(
    (newData?: DashboardData) => {
      if (newData) {
        mutate(newData, false);
      } else {
        mutate();
      }
    },
    [mutate]
  );

  // Don't show loading if we have cached data (stale-while-revalidate)
  const effectiveLoading = isLoading && !data;

  const value = useMemo(
    () => ({
      data: data || null,
      isLoading: effectiveLoading,
      error: error || null,
      refresh,
      mutate: handleMutate,
    }),
    [data, effectiveLoading, error, refresh, handleMutate]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}

// Specialized hooks for individual sections
export function useDashboardMetrics() {
  const { data, isLoading, error } = useDashboard();
  return {
    metrics: data?.metrics || null,
    isLoading,
    error,
  };
}

export function useDashboardActivity() {
  const { data, isLoading, error } = useDashboard();
  return {
    activities: data?.activity || [],
    isLoading,
    error,
  };
}

export function useDashboardBriefing() {
  const { data, isLoading, error } = useDashboard();
  return {
    briefing: data?.briefing || null,
    isLoading,
    error,
  };
}

export function useDashboardAnnouncements() {
  const { data, isLoading, error, refresh } = useDashboard();
  return {
    announcements: data?.announcements || [],
    isLoading,
    error,
    refresh,
  };
}

export function useDashboardGoals() {
  const { data, isLoading, error, refresh } = useDashboard();
  return {
    goals: data?.goals || [],
    isLoading,
    error,
    refresh,
  };
}

export function useDashboardBookmarks() {
  const { data, isLoading, error, refresh } = useDashboard();
  return {
    bookmarks: data?.bookmarks || [],
    isLoading,
    error,
    refresh,
  };
}

export function useDashboardSettings() {
  const { data, isLoading, error } = useDashboard();
  return {
    settings: data?.settings || null,
    isLoading,
    error,
  };
}

export function useDashboardUpcoming() {
  const { data, isLoading, error } = useDashboard();
  return {
    upcoming: data?.upcoming || { tasks: [], events: [] },
    isLoading,
    error,
  };
}

export type {
  DashboardData,
  DashboardMetrics,
  DashboardSettings,
  Activity,
  Announcement,
  Goal,
  Bookmark,
  BriefingData,
  ScheduleItem,
  TaskItem,
  TeamMember,
};
