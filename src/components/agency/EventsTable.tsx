"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { AddEventModal } from "./modals";
import { EventDetailsSidebar } from "./sidebars";

interface EventRequirements {
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
}

export interface Event {
  id: string;
  event_number?: string;
  slug?: string;
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
  timezone?: string;
  attendees_count?: number;
  max_attendees?: number;
  is_public?: boolean;
  is_published?: boolean;
  registration_required?: boolean;
  registration_deadline?: string;
  ticket_price?: number;
  currency?: string;
  tags?: string[];
  notes?: string;
  requirements?: EventRequirements;
  cover_image?: string;
  organizer_name?: string;
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
    avatar_url?: string | null;
    email?: string;
  } | null;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

const statusConfig: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "light" }> = {
  upcoming: { label: "Upcoming", color: "primary" },
  in_progress: { label: "In Progress", color: "warning" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

const eventTypeConfig: Record<string, { label: string; icon: string }> = {
  general: { label: "General", icon: "📅" },
  meeting: { label: "Meeting", icon: "👥" },
  conference: { label: "Conference", icon: "🎤" },
  workshop: { label: "Workshop", icon: "🔧" },
  webinar: { label: "Webinar", icon: "💻" },
  hackathon: { label: "Hackathon", icon: "💻" },
  game_jam: { label: "Game Jam", icon: "🎮" },
  keynote: { label: "Keynote", icon: "🎙️" },
  panel: { label: "Panel Discussion", icon: "🗣️" },
  fireside_chat: { label: "Fireside Chat", icon: "🔥" },
  product_launch: { label: "Product Launch", icon: "🚀" },
  demo_day: { label: "Demo Day", icon: "📊" },
  design_sprint: { label: "Design Sprint", icon: "🎨" },
  awards: { label: "Awards Ceremony", icon: "🏆" },
  networking: { label: "Networking", icon: "🤝" },
  training: { label: "Training", icon: "📚" },
  team_building: { label: "Team Building", icon: "🎯" },
  client_meeting: { label: "Client Meeting", icon: "💼" },
  deadline: { label: "Deadline", icon: "⏰" },
  milestone: { label: "Milestone", icon: "🏁" },
};

const categoryColors: Record<string, string> = {
  "Tech Events": "bg-purple-500",
  "Speaking & Presentations": "bg-blue-500",
  "Business Events": "bg-green-500",
  "Creative Events": "bg-pink-500",
  "Networking & Social": "bg-orange-500",
  "Internal": "bg-gray-500",
  "Client": "bg-brand-500",
  "General": "bg-gray-400",
};

export const EventsTable = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch events");
      }

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleViewEvent = (event: Event) => {
    setViewingEvent(event);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setViewingEvent(null);
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete event");
      }

      setEvents(events.filter((e) => e.id !== id));
      if (viewingEvent?.id === id) {
        setViewingEvent(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleEventSaved = () => {
    handleModalClose();
    fetchEvents();
  };

  const copyEventLink = (event: Event) => {
    if (event.slug) {
      const link = `${window.location.origin}/event/${event.slug}`;
      navigator.clipboard.writeText(link);
      alert("Event link copied to clipboard!");
    }
  };

  const getAttendeeCount = (event: Event) => event.attendees_count ?? 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d ago`, color: "text-gray-400" };
    if (diffDays === 0) return { text: "Today", color: "text-success-500" };
    if (diffDays === 1) return { text: "Tomorrow", color: "text-warning-500" };
    if (diffDays <= 7) return { text: `In ${diffDays}d`, color: "text-brand-500" };
    return { text: `In ${diffDays}d`, color: "text-gray-500" };
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.event_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(events.map((e) => e.category).filter(Boolean))];

  // Stats
  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === "upcoming").length,
    inProgress: events.filter((e) => e.status === "in_progress").length,
    completed: events.filter((e) => e.status === "completed").length,
    totalAttendees: events.reduce((sum, e) => sum + getAttendeeCount(e), 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="text-center py-8">
          <p className="text-error-500 mb-4">{error}</p>
          <button onClick={fetchEvents} className="text-brand-500 hover:text-brand-600">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Attendees</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{stats.totalAttendees.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat!}>{cat}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-l-lg p-2.5 ${viewMode === "grid" ? "bg-brand-500 text-white" : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
              title="Grid View"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-r-lg p-2.5 ${viewMode === "list" ? "bg-brand-500 text-white" : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
              title="List View"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/dashboard/events/calendar"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendar
          </a>
          <button
            onClick={handleAddEvent}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
        </div>
      </div>

      {/* Events Grid View */}
      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">No events found</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first event"}
              </p>
              {!searchQuery && statusFilter === "all" && categoryFilter === "all" && (
                <button
                  onClick={handleAddEvent}
                  className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Create Event
                </button>
              )}
            </div>
          ) : (
            filteredEvents.map((event) => {
              const daysInfo = getDaysUntil(event.start_date);
              return (
                <div
                  key={event.id}
                  className="group relative rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  {/* Event Header with Color */}
                  <div
                    className="h-2"
                    style={{ backgroundColor: event.color || categoryColors[event.category || "General"] || "#6366f1" }}
                  />

                  <div className="p-4">
                    {/* Category & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {event.category || "General"}
                      </span>
                      <Badge size="sm" color={statusConfig[event.status]?.color || "light"}>
                        {statusConfig[event.status]?.label || event.status}
                      </Badge>
                    </div>

                    {/* Event Icon & Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-lg flex-shrink-0"
                        style={{ backgroundColor: `${event.color || "#6366f1"}20` }}
                      >
                        {event.icon || eventTypeConfig[event.event_type || "general"]?.icon || "📅"}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => handleViewEvent(event)}
                          className="text-left font-semibold text-gray-800 dark:text-white hover:text-brand-500 dark:hover:text-brand-400 line-clamp-2"
                        >
                          {event.title}
                        </button>
                        <p className="text-xs text-gray-400 mt-0.5">{event.event_number}</p>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(event.start_date)}</span>
                      {event.start_time && (
                        <span className="text-gray-400">• {formatTime(event.start_time)}</span>
                      )}
                    </div>

                    {/* Location / Virtual */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {event.is_virtual ? (
                        <>
                          <svg className="h-4 w-4 flex-shrink-0 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{event.virtual_platform || "Virtual Event"}</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{event.location || event.venue?.name || "TBD"}</span>
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${daysInfo.color}`}>{daysInfo.text}</span>
                        {getAttendeeCount(event) > 0 && (
                          <span className="text-xs text-gray-400">
                            • {getAttendeeCount(event)} attendees
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {event.slug && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyEventLink(event);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Copy event link"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewEvent(event);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="View details"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Events List View */}
      {viewMode === "list" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">No events found</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first event"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event</TableCell>
                  <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</TableCell>
                  <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Location</TableCell>
                  <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</TableCell>
                  <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Attendees</TableCell>
                  <TableCell isHeader className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-lg flex-shrink-0"
                          style={{ backgroundColor: `${event.color || "#6366f1"}20` }}
                        >
                          {event.icon || eventTypeConfig[event.event_type || "general"]?.icon || "📅"}
                        </div>
                        <div>
                          <button
                            onClick={() => handleViewEvent(event)}
                            className="font-medium text-gray-800 dark:text-white hover:text-brand-500 dark:hover:text-brand-400"
                          >
                            {event.title}
                          </button>
                          <p className="text-xs text-gray-400">{event.event_number} • {event.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-gray-800 dark:text-white">{formatDate(event.start_date)}</div>
                      {event.start_time && (
                        <div className="text-xs text-gray-400">{formatTime(event.start_time)}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {event.is_virtual ? (
                          <>
                            <svg className="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{event.virtual_platform || "Virtual"}</span>
                          </>
                        ) : (
                          <span className="truncate max-w-[150px]">{event.location || event.venue?.name || "TBD"}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge size="sm" color={statusConfig[event.status]?.color || "light"}>
                        {statusConfig[event.status]?.label || event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getAttendeeCount(event)}
                        {event.max_attendees && ` / ${event.max_attendees}`}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {event.slug && (
                          <button
                            onClick={() => copyEventLink(event)}
                            className="text-gray-400 hover:text-brand-500"
                            title="Copy link"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleViewEvent(event)}
                          className="text-brand-500 hover:text-brand-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={deletingId === event.id}
                          className="text-error-500 hover:text-error-600 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleEventSaved}
        event={editingEvent}
      />

      {/* Event Details Sidebar */}
      <EventDetailsSidebar
        isOpen={!!viewingEvent}
        onClose={() => setViewingEvent(null)}
        event={viewingEvent}
        onUpdate={fetchEvents}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

export default EventsTable;
