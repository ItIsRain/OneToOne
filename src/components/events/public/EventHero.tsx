import React from "react";
import Image from "next/image";
import { Icons, eventTypeIcons } from "./EventIcons";

interface EventHeroProps {
  title: string;
  eventType: string;
  eventTypeLabel: string;
  status: string;
  coverImage: string | null;
  eventColor: string;
}

export const EventHero: React.FC<EventHeroProps> = ({
  title,
  eventType,
  eventTypeLabel,
  status,
  coverImage,
  eventColor,
}) => {
  const eventIcon = eventTypeIcons[eventType] || Icons.calendar;

  return (
    <div
      className="relative h-72 md:h-80 lg:h-96"
      style={{ backgroundColor: eventColor }}
    >
      {coverImage ? (
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="text-white/10 transform scale-[8]">
            {eventIcon}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Event Type Badge */}
      <div className="absolute top-4 left-4">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-md text-white border border-white/10">
          <span className="w-4 h-4">{eventIcon}</span>
          {eventTypeLabel}
        </span>
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          status === "upcoming" ? "bg-blue-500/90 text-white" :
          status === "in_progress" ? "bg-green-500/90 text-white" :
          status === "completed" ? "bg-gray-500/90 text-white" :
          "bg-red-500/90 text-white"
        }`}>
          {status === "upcoming" && Icons.clock}
          {status === "in_progress" && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
          {status === "completed" && Icons.check}
          {status === "cancelled" && Icons.x}
          {status === "upcoming" ? "Upcoming" :
           status === "in_progress" ? "Live Now" :
           status === "completed" ? "Completed" :
           "Cancelled"}
        </span>
      </div>
    </div>
  );
};
