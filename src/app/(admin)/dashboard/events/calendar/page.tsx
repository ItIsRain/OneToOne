"use client";
import React, { useState, useEffect, useMemo } from "react";
import { EventDetailsSidebar } from "@/components/agency/sidebars";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

interface Event {
  id: string;
  event_number?: string;
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  status: "upcoming" | "in_progress" | "completed" | "cancelled";
  event_type?: string;
  category?: string;
  icon?: string;
  color?: string;
  is_virtual?: boolean;
  virtual_platform?: string;
  virtual_link?: string;
  attendees_count?: number;
  max_attendees?: number;
  tags?: string[];
  notes?: string;
  requirements?: {
    problemStatement?: string;
    judgingCriteria?: string[];
    prizes?: { place: string; prize: string }[];
    teamSize?: string;
    themes?: string[];
    rules?: string[];
    submissionDeadline?: string;
    techStack?: string[];
    speakerName?: string;
    speakerBio?: string;
    speakerNotes?: string;
    talkDuration?: string;
    talkTopics?: string[];
    slidesUrl?: string;
    panelists?: { name: string; title: string; bio: string }[];
    moderator?: string;
    discussionTopics?: string[];
    prerequisites?: string[];
    materialsNeeded?: string[];
    curriculum?: { title: string; duration: string; description: string }[];
    maxParticipants?: number;
    skillLevel?: string;
    certification?: boolean;
    tracks?: { name: string; description: string }[];
    schedule?: { time: string; title: string; speaker?: string; room?: string }[];
    keynotes?: { speaker: string; topic: string; time: string }[];
    dressCode?: string;
    menuOptions?: string[];
    entertainment?: string;
    awardCategories?: { category: string; nominees?: string[] }[];
    votingDeadline?: string;
    productName?: string;
    productDescription?: string;
    demoSchedule?: { time: string; presenter: string; product: string }[];
    pressContacts?: string[];
    sponsors?: { name: string; tier: string }[];
    agenda?: { time: string; activity: string }[];
    faqs?: { question: string; answer: string }[];
    contactPerson?: string;
    contactEmail?: string;
  };
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  client?: {
    id: string;
    name: string;
    company?: string;
    email?: string;
  } | null;
  venue?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    capacity?: number;
  } | null;
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    avatar_url?: string | null;
  } | null;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const eventTypeIcons: Record<string, string> = {
  general: "📅",
  meeting: "👥",
  conference: "🎤",
  workshop: "🔧",
  webinar: "💻",
  hackathon: "💻",
  keynote: "🎙️",
  panel: "🗣️",
  product_launch: "🚀",
  demo_day: "📊",
  design_sprint: "🎨",
  awards: "🏆",
  networking: "🤝",
  training: "📚",
  team_building: "🎯",
  client_meeting: "💼",
  deadline: "⏰",
  milestone: "🏁",
};

const statusColors: Record<string, string> = {
  upcoming: "bg-brand-500",
  in_progress: "bg-warning-500",
  completed: "bg-success-500",
  cancelled: "bg-error-500",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Get first and last day of current month for filtering
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).toISOString();
      const lastDay = new Date(year, month + 1, 0).toISOString();

      const response = await fetch(`/api/events?start_date=${firstDay}&end_date=${lastDay}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay();

    return { year, month, daysInMonth, startDay };
  }, [currentDate]);

  const getEventsForDay = (day: number) => {
    const { year, month } = calendarData;
    const dateStr = new Date(year, month, day).toISOString().split("T")[0];
    return events.filter((event) => {
      const eventDate = event.start_date.split("T")[0];
      return eventDate === dateStr;
    });
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  // Stats
  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === "upcoming").length,
    inProgress: events.filter((e) => e.status === "in_progress").length,
    completed: events.filter((e) => e.status === "completed").length,
  };

  return (
    <ProtectedPage permission={PERMISSIONS.EVENTS_VIEW}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Calendar</h1>
            <p className="text-gray-500 dark:text-gray-400">View and manage your events schedule</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setViewMode("month")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  viewMode === "month"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  viewMode === "week"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Week
              </button>
            </div>

            <button
              onClick={goToToday}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Today
            </button>
            <a
              href="/dashboard/events"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Events
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
            <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
            <p className="mt-1 text-2xl font-bold text-brand-500">{stats.upcoming}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="mt-1 text-2xl font-bold text-warning-500">{stats.inProgress}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="mt-1 text-2xl font-bold text-success-500">{stats.completed}</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">{monthName}</h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {days.map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: calendarData.startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[100px] rounded-lg bg-gray-50/50 dark:bg-gray-800/20" />
                  ))}

                  {/* Days of month */}
                  {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div
                        key={day}
                        className={`min-h-[100px] rounded-lg border p-2 transition-all cursor-pointer ${
                          isToday(day)
                            ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm font-medium ${
                              isToday(day)
                                ? "text-brand-600 dark:text-brand-400"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {day}
                          </span>
                          {hasEvents && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => handleEventClick(event, e)}
                              className={`group px-2 py-1 rounded text-xs text-white truncate cursor-pointer transition-all hover:opacity-90 ${
                                event.color ? "" : statusColors[event.status] || "bg-brand-500"
                              }`}
                              style={event.color ? { backgroundColor: event.color } : {}}
                              title={event.title}
                            >
                              <span className="mr-1">
                                {event.icon || eventTypeIcons[event.event_type || "general"]}
                              </span>
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-brand-500" />
                <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-warning-500" />
                <span className="text-gray-600 dark:text-gray-400">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-success-500" />
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-error-500" />
                <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events List */}
        {events.filter((e) => e.status === "upcoming").length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Upcoming This Month</h3>
            <div className="space-y-3">
              {events
                .filter((e) => e.status === "upcoming")
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${event.color || "#6366f1"}20` }}
                    >
                      {event.icon || eventTypeIcons[event.event_type || "general"]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white truncate">{event.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(event.start_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {event.start_time && ` at ${event.start_time}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.is_virtual && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                          Virtual
                        </span>
                      )}
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Event Details Sidebar */}
      <EventDetailsSidebar
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onUpdate={fetchEvents}
      />
    </ProtectedPage>
  );
}
