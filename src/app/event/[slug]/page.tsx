"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  event_type: string;
  category: string;
  icon: string | null;
  color: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  timezone: string | null;
  location: string | null;
  is_virtual: boolean;
  virtual_platform: string | null;
  virtual_link: string | null;
  attendees_count: number;
  max_attendees: number | null;
  is_public: boolean;
  registration_required: boolean;
  ticket_price: number | null;
  tags: string[];
  cover_image: string | null;
  organizer_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  status: string;
  requirements: {
    equipment?: string[];
    software?: string[];
    skills?: string[];
    other?: string[];
  } | null;
}

const eventTypeIcons: Record<string, string> = {
  hackathon: "code",
  speaking: "mic",
  game_jam: "gamepad",
  conference: "users",
  workshop: "book",
  meetup: "coffee",
  webinar: "video",
  other: "calendar",
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeString: string | null) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/public/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Event not found");
          } else {
            setError("Failed to load event");
          }
          return;
        }
        const data = await response.json();
        setEvent(data);
      } catch {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {error || "Event not found"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            The event you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const eventColor = event.color || "#3B82F6";
  const spotsLeft = event.max_attendees ? event.max_attendees - event.attendees_count : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div
        className="relative h-64 md:h-80 lg:h-96"
        style={{ backgroundColor: eventColor }}
      >
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/20 text-9xl">
              {eventTypeIcons[event.event_type] === "code" && "{ }"}
              {eventTypeIcons[event.event_type] === "mic" && "🎤"}
              {eventTypeIcons[event.event_type] === "gamepad" && "🎮"}
              {eventTypeIcons[event.event_type] === "users" && "👥"}
              {eventTypeIcons[event.event_type] === "book" && "📚"}
              {eventTypeIcons[event.event_type] === "coffee" && "☕"}
              {eventTypeIcons[event.event_type] === "video" && "🎥"}
              {eventTypeIcons[event.event_type] === "calendar" && "📅"}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Event Type Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
            {event.event_type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            event.status === "upcoming" ? "bg-blue-500 text-white" :
            event.status === "in_progress" ? "bg-green-500 text-white" :
            event.status === "completed" ? "bg-gray-500 text-white" :
            "bg-red-500 text-white"
          }`}>
            {event.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Event Header */}
          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {event.title}
            </h1>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${eventColor}20`, color: eventColor }}>
                  📅
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(event.date)}
                  </p>
                  {event.start_time && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(event.start_time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                      {event.timezone && ` (${event.timezone})`}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${eventColor}20`, color: eventColor }}>
                  {event.is_virtual ? "💻" : "📍"}
                </div>
                <div>
                  {event.is_virtual ? (
                    <>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Virtual Event
                      </p>
                      {event.virtual_platform && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          via {event.virtual_platform}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.location || "Location TBA"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        In-person event
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Attendees */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${eventColor}20`, color: eventColor }}>
                  👥
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.attendees_count} {event.attendees_count === 1 ? "Attendee" : "Attendees"}
                  </p>
                  {event.max_attendees && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isFull ? "Event is full" : `${spotsLeft} spots left`}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${eventColor}20`, color: eventColor }}>
                  🎫
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.ticket_price ? `$${event.ticket_price}` : "Free"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {event.registration_required ? "Registration required" : "No registration needed"}
                  </p>
                </div>
              </div>
            </div>

            {/* Register Button */}
            {event.status === "upcoming" && event.registration_required && (
              <button
                disabled={isFull}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all ${
                  isFull
                    ? "bg-gray-400 cursor-not-allowed"
                    : "hover:opacity-90 hover:shadow-lg"
                }`}
                style={{ backgroundColor: isFull ? undefined : eventColor }}
              >
                {isFull ? "Event is Full" : "Register Now"}
              </button>
            )}

            {event.is_virtual && event.virtual_link && event.status === "in_progress" && (
              <a
                href={event.virtual_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-6 rounded-xl font-semibold text-white text-center transition-all hover:opacity-90 hover:shadow-lg"
                style={{ backgroundColor: eventColor }}
              >
                Join Event
              </a>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="px-6 md:px-8 pb-6 md:pb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                About This Event
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {event.requirements && Object.values(event.requirements).some(arr => arr && arr.length > 0) && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 border-t border-gray-100 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Requirements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.requirements.equipment && event.requirements.equipment.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Equipment</h3>
                    <ul className="space-y-1">
                      {event.requirements.equipment.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eventColor }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {event.requirements.software && event.requirements.software.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Software</h3>
                    <ul className="space-y-1">
                      {event.requirements.software.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eventColor }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {event.requirements.skills && event.requirements.skills.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</h3>
                    <ul className="space-y-1">
                      {event.requirements.skills.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eventColor }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {event.requirements.other && event.requirements.other.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Other</h3>
                    <ul className="space-y-1">
                      {event.requirements.other.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: eventColor }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organizer */}
          {(event.organizer_name || event.contact_name || event.contact_email) && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 border-t border-gray-100 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Organizer
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: eventColor }}>
                  {(event.organizer_name || event.contact_name || "O").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.organizer_name || event.contact_name || "Event Organizer"}
                  </p>
                  {event.contact_email && (
                    <a
                      href={`mailto:${event.contact_email}`}
                      className="text-sm hover:underline"
                      style={{ color: eventColor }}
                    >
                      {event.contact_email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          Powered by OneToOne Events
        </div>
      </div>
    </div>
  );
}
