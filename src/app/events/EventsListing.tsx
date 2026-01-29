"use client";

import Link from "next/link";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  is_virtual: boolean;
  cover_image: string | null;
  category: string | null;
  event_type: string | null;
  ticket_price: number | null;
}

interface EventsListingProps {
  events: EventItem[];
  tenantName: string;
  primaryColor: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventsListing({ events, tenantName, primaryColor }: EventsListingProps) {
  const now = new Date();
  const upcoming = events.filter((e) => !e.start_date || new Date(e.start_date) >= now);
  const past = events.filter((e) => e.start_date && new Date(e.start_date) < now);

  return (
    <div className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Events
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Browse all events from {tenantName}
          </p>
        </div>

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Upcoming Events
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} primaryColor={primaryColor} />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-6">
              Past Events
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
              {past.map((event) => (
                <EventCard key={event.id} event={event} primaryColor={primaryColor} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {events.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No events yet
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Check back soon for new events and updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, primaryColor }: { event: EventItem; primaryColor: string }) {
  return (
    <Link
      href={`/event/${event.slug || event.id}`}
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all"
    >
      {/* Cover Image */}
      <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {event.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <svg className="w-12 h-12 opacity-30" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        )}
        {(event.category || event.event_type) && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-full text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {event.category || event.event_type}
          </span>
        )}
        {event.ticket_price !== null && event.ticket_price > 0 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow">
            ${event.ticket_price}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:opacity-80 transition-opacity line-clamp-2 text-lg">
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {event.description}
          </p>
        )}
        {event.start_date && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(event.start_date)} &middot; {formatTime(event.start_date)}
          </p>
        )}
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          {event.is_virtual ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Virtual Event
            </>
          ) : event.location ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.location}
            </>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
