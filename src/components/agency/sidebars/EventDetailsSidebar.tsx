"use client";
import React, { useState } from "react";
import Link from "next/link";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";

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
  timezone?: string;
  attendees_count?: number;
  max_attendees?: number;
  confirmed_attendees?: number;
  is_public?: boolean;
  is_published?: boolean;
  registration_required?: boolean;
  registration_deadline?: string;
  ticket_price?: number;
  currency?: string;
  tags?: string[];
  notes?: string;
  requirements?: Record<string, unknown>;
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

interface EventDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onUpdate?: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "light" }> = {
  upcoming: { label: "Upcoming", color: "primary" },
  in_progress: { label: "In Progress", color: "warning" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

const eventTypeConfig: Record<string, { label: string; icon: string }> = {
  general: { label: "General Event", icon: "📅" },
  hackathon: { label: "Hackathon", icon: "💻" },
  workshop: { label: "Workshop", icon: "🔧" },
  meetup: { label: "Meetup", icon: "🤝" },
  game_jam: { label: "Game Jam", icon: "🎮" },
  demo_day: { label: "Demo Day", icon: "🚀" },
};

const platformConfig: Record<string, string> = {
  zoom: "Zoom",
  teams: "Microsoft Teams",
  google_meet: "Google Meet",
  webex: "Webex",
  discord: "Discord",
  twitch: "Twitch",
  youtube: "YouTube Live",
  custom: "Custom Platform",
};

export const EventDetailsSidebar: React.FC<EventDetailsSidebarProps> = ({
  isOpen,
  onClose,
  event,
  onUpdate,
  onEdit,
  onDelete,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  // Cast requirements to EventRequirements for type-safe access
  const requirements = (event.requirements || {}) as EventRequirements;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    // Handle both "HH:MM" and "HH:MM:SS" formats
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isUpcoming = event.status === "upcoming" && new Date(event.start_date) > new Date();
  const isPast = new Date(event.start_date) < new Date() && event.status !== "completed";

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePublish = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !event.is_published }),
      });
      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePublic = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !event.is_public }),
      });
      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error toggling public:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (response.ok) {
        if (onDelete) onDelete(event.id);
        onClose();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDaysUntil = () => {
    const eventDate = new Date(event.start_date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  const headerActions = (
    <div className="flex items-center gap-1">
      {onEdit && (
        <button
          onClick={() => onEdit(event)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          title="Edit"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      subtitle={`${event.event_number || ""}${event.category ? ` • ${event.category}` : ""}`}
      headerActions={headerActions}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={statusConfig[event.status]?.color || "light"}>
              {statusConfig[event.status]?.label || event.status}
            </Badge>
            {event.event_type && (
              <Badge size="sm" color="light">
                {eventTypeConfig[event.event_type]?.icon} {eventTypeConfig[event.event_type]?.label || event.event_type}
              </Badge>
            )}
            {event.is_virtual && (
              <Badge size="sm" color="primary">Virtual</Badge>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Event Icon & Color Banner */}
        <div
          className="flex items-center gap-4 p-4 rounded-xl"
          style={{ backgroundColor: `${event.color || "#6366f1"}15` }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: event.color || "#6366f1" }}
          >
            {event.icon || eventTypeConfig[event.event_type || "general"]?.icon || "📅"}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {getDaysUntil()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(event.start_date)}
              {event.start_time && ` at ${formatTime(event.start_time)}`}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <StatsGrid columns={3}>
          <StatItem
            label="Attendees"
            value={`${event.attendees_count || 0}${event.max_attendees ? `/${event.max_attendees}` : ""}`}
          />
          <StatItem
            label="Duration"
            value={event.start_time && event.end_time
              ? `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`
              : "-"
            }
          />
          <StatItem
            label="Type"
            value={eventTypeConfig[event.event_type || "general"]?.label || "General"}
          />
        </StatsGrid>

        {/* Status Update */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">Status</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => handleStatusUpdate(key)}
                disabled={isUpdating || event.status === key}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  event.status === key
                    ? "bg-brand-500 text-white ring-2 ring-brand-500/30"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                } disabled:opacity-50`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions - Publish & Public */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-500/10 dark:to-purple-500/10 border border-brand-100 dark:border-brand-500/20">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h4>
          <div className="space-y-3">
            {/* Publish Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Make event live and accessible</p>
              </div>
              <button
                onClick={handleTogglePublish}
                disabled={isUpdating}
                className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                  event.is_published ? "bg-success-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    event.is_published ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
            {/* Public Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Public Event</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Visible to anyone with the link</p>
              </div>
              <button
                onClick={handleTogglePublic}
                disabled={isUpdating}
                className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                  event.is_public ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    event.is_public ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={() => onEdit(event)}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Event
              </button>
            )}
          </div>
        </div>

        {/* Event Management */}
        {event.registration_required && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Event Management
            </h4>
            <div className="space-y-2">
              <Link
                href={`/dashboard/events/${event.id}/attendees`}
                className="w-full flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">Manage Attendees</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.attendees_count || 0} registered
                    </p>
                  </div>
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Submissions link - only for hackathon/game_jam */}
              {(event.event_type === "hackathon" || event.event_type === "game_jam") && (
                <Link
                  href={`/dashboard/events/${event.id}/submissions`}
                  className="w-full flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="font-medium">Manage Submissions</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        View & mark winners
                      </p>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Client */}
        {event.client && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-800 dark:text-white truncate">
                {event.client.company || event.client.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {event.client.email}
              </p>
            </div>
          </div>
        )}

        {/* Location / Virtual Platform */}
        <Section title="Location">
          {event.is_virtual ? (
            <div className="space-y-2">
              <InfoRow
                label="Platform"
                value={platformConfig[event.virtual_platform || ""] || event.virtual_platform}
              />
              {event.virtual_link && (
                <InfoRow
                  label="Meeting Link"
                  value={
                    <a
                      href={event.virtual_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:text-brand-600 truncate block max-w-[200px]"
                    >
                      Join Meeting
                    </a>
                  }
                />
              )}
            </div>
          ) : event.venue ? (
            <div className="space-y-1">
              <p className="font-medium text-gray-800 dark:text-white">{event.venue.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {[event.venue.address, event.venue.city].filter(Boolean).join(", ")}
              </p>
              {event.venue.capacity && (
                <p className="text-xs text-gray-400">Capacity: {event.venue.capacity}</p>
              )}
            </div>
          ) : event.location ? (
            <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
          ) : (
            <p className="text-gray-400">No location set</p>
          )}
        </Section>

        {/* Date & Time */}
        <Section title="Schedule">
          <InfoRow label="Start Date" value={formatDate(event.start_date)} />
          {event.end_date && event.end_date !== event.start_date && (
            <InfoRow label="End Date" value={formatDate(event.end_date)} />
          )}
          <InfoRow
            label="Time"
            value={
              event.start_time
                ? `${formatTime(event.start_time)}${event.end_time ? ` - ${formatTime(event.end_time)}` : ""}`
                : "-"
            }
          />
          {event.timezone && (
            <InfoRow label="Timezone" value={event.timezone} />
          )}
        </Section>

        {/* Description */}
        {event.description && (
          <Section title="Description">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {event.description}
            </p>
          </Section>
        )}

        {/* Registration & Visibility */}
        <Section title="Visibility & Registration">
          <div className="flex items-center gap-2 mb-3">
            <Badge size="sm" color={event.is_published ? "success" : "light"}>
              {event.is_published ? "Published" : "Draft"}
            </Badge>
            <Badge size="sm" color={event.is_public ? "primary" : "light"}>
              {event.is_public ? "Public" : "Private"}
            </Badge>
          </div>
          <InfoRow label="Registration" value={event.registration_required ? "Required" : "Not required"} />
          {event.registration_deadline && (
            <InfoRow label="Deadline" value={formatDateTime(event.registration_deadline)} />
          )}
          {event.ticket_price && (
            <InfoRow
              label="Ticket Price"
              value={`${event.currency || "USD"} ${event.ticket_price.toFixed(2)}`}
            />
          )}
        </Section>

        {/* Assignee */}
        <Section title="Assignment">
          <InfoRow
            label="Organizer"
            value={
              event.assignee ? (
                <div className="flex items-center gap-2">
                  {event.assignee.avatar_url ? (
                    <img
                      src={event.assignee.avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                      {event.assignee.first_name?.[0]}{event.assignee.last_name?.[0]}
                    </div>
                  )}
                  <span>{event.assignee.first_name} {event.assignee.last_name}</span>
                </div>
              ) : (
                "Unassigned"
              )
            }
          />
          <InfoRow
            label="Created By"
            value={event.creator ? `${event.creator.first_name} ${event.creator.last_name}` : null}
          />
        </Section>

        {/* Contact Information */}
        {(event.contact_name || event.contact_email || event.contact_phone) && (
          <Section title="Contact Information">
            {event.contact_name && <InfoRow label="Name" value={event.contact_name} />}
            {event.contact_email && (
              <InfoRow
                label="Email"
                value={
                  <a href={`mailto:${event.contact_email}`} className="text-brand-500 hover:text-brand-600">
                    {event.contact_email}
                  </a>
                }
              />
            )}
            {event.contact_phone && (
              <InfoRow
                label="Phone"
                value={
                  <a href={`tel:${event.contact_phone}`} className="text-brand-500 hover:text-brand-600">
                    {event.contact_phone}
                  </a>
                }
              />
            )}
          </Section>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Notes */}
        {event.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {event.notes}
            </p>
          </Section>
        )}

        {/* Requirements - Type specific */}
        {Object.keys(requirements).length > 0 && (
          <Section title="Event Details" collapsible defaultOpen={false}>
            {/* Hackathon specific */}
            {requirements.problemStatement && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Challenge</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{requirements.problemStatement}</p>
              </div>
            )}
            {requirements.prizes && requirements.prizes.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prizes</p>
                <div className="space-y-1">
                  {requirements.prizes.map((prize, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{prize.place}</span>
                      <span className="font-medium text-gray-800 dark:text-white">{prize.prize}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speaker specific */}
            {requirements.speakerName && (
              <InfoRow label="Speaker" value={requirements.speakerName} />
            )}
            {requirements.talkDuration && (
              <InfoRow label="Duration" value={requirements.talkDuration} />
            )}

            {/* Workshop specific */}
            {requirements.skillLevel && (
              <InfoRow label="Skill Level" value={requirements.skillLevel} />
            )}
            {requirements.maxParticipants && (
              <InfoRow label="Max Participants" value={requirements.maxParticipants} />
            )}

            {/* General */}
            {requirements.dressCode && (
              <InfoRow label="Dress Code" value={requirements.dressCode} />
            )}
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDateTime(event.created_at)}</p>
          <p>Updated: {formatDateTime(event.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default EventDetailsSidebar;
