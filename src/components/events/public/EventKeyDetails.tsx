import React from "react";
import { Icons } from "./EventIcons";

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

interface EventKeyDetailsProps {
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  location: string | null;
  isVirtual: boolean;
  virtualPlatform: string | null;
  attendeesCount: number;
  maxAttendees: number | null;
  isFull: boolean;
  spotsLeft: number | null;
  ticketPrice: number | null;
  currency: string | null;
  registrationRequired: boolean;
  eventColor: string;
}

export const EventKeyDetails: React.FC<EventKeyDetailsProps> = ({
  startDate,
  endDate,
  startTime,
  endTime,
  timezone,
  location,
  isVirtual,
  virtualPlatform,
  attendeesCount,
  maxAttendees,
  isFull,
  spotsLeft,
  ticketPrice,
  currency,
  registrationRequired,
  eventColor,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Date & Time */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
        >
          {Icons.calendar}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatDate(startDate)}
          </p>
          {startTime && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatTime(startTime)}
              {endTime && ` - ${formatTime(endTime)}`}
              {timezone && ` (${timezone})`}
            </p>
          )}
          {endDate && endDate !== startDate && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Until {formatDate(endDate)}
            </p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
        >
          {isVirtual ? Icons.video : Icons.location}
        </div>
        <div>
          {isVirtual ? (
            <>
              <p className="font-semibold text-gray-900 dark:text-white">
                Virtual Event
              </p>
              {virtualPlatform && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  via {virtualPlatform.charAt(0).toUpperCase() + virtualPlatform.slice(1).replace(/_/g, " ")}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-900 dark:text-white">
                {location || "Location TBA"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                In-person event
              </p>
            </>
          )}
        </div>
      </div>

      {/* Attendees */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
        >
          {Icons.users}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {attendeesCount} {attendeesCount === 1 ? "Attendee" : "Attendees"}
          </p>
          {maxAttendees && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isFull ? "Event is full" : `${spotsLeft} spots remaining`}
            </p>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
        >
          {Icons.ticket}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {ticketPrice ? `${currency || "$"}${ticketPrice}` : "Free Event"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {registrationRequired ? "Registration required" : "No registration needed"}
          </p>
        </div>
      </div>
    </div>
  );
};
