import React from "react";
import type { FormField } from "@/config/eventTypeSchema";
import { Icons, tabIconMap } from "./EventIcons";
import { FieldValue } from "./FieldValue";
import { EventKeyDetails } from "./EventKeyDetails";

interface FieldSection {
  title: string;
  icon: React.ReactNode;
  fields: { field: FormField; value: unknown }[];
}

interface EventInfoCardProps {
  title: string;
  tags: string[];
  description: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  location: string | null;
  isVirtual: boolean;
  virtualPlatform: string | null;
  virtualLink: string | null;
  attendeesCount: number;
  maxAttendees: number | null;
  ticketPrice: number | null;
  currency: string | null;
  registrationRequired: boolean;
  status: string;
  fieldSections: FieldSection[];
  organizerName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  eventColor: string;
  onRegisterClick: () => void;
  onPortalClick: () => void;
}

export const EventInfoCard: React.FC<EventInfoCardProps> = ({
  title,
  tags,
  description,
  startDate,
  endDate,
  startTime,
  endTime,
  timezone,
  location,
  isVirtual,
  virtualPlatform,
  virtualLink,
  attendeesCount,
  maxAttendees,
  ticketPrice,
  currency,
  registrationRequired,
  status,
  fieldSections,
  organizerName,
  contactName,
  contactEmail,
  contactPhone,
  eventColor,
  onRegisterClick,
  onPortalClick,
}) => {
  const spotsLeft = maxAttendees ? maxAttendees - attendeesCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Event Header */}
      <div className="p-6 md:p-8 lg:p-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {title}
        </h1>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Key Details Grid */}
        <EventKeyDetails
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          timezone={timezone}
          location={location}
          isVirtual={isVirtual}
          virtualPlatform={virtualPlatform}
          attendeesCount={attendeesCount}
          maxAttendees={maxAttendees}
          isFull={isFull}
          spotsLeft={spotsLeft}
          ticketPrice={ticketPrice}
          currency={currency}
          registrationRequired={registrationRequired}
          eventColor={eventColor}
        />

        {/* Register Button */}
        {status === "upcoming" && registrationRequired && (
          <div className="space-y-3">
            <button
              onClick={onRegisterClick}
              disabled={isFull}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-white text-lg transition-all flex items-center justify-center gap-3 ${
                isFull
                  ? "bg-gray-400 cursor-not-allowed"
                  : "hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
              }`}
              style={{ backgroundColor: isFull ? undefined : eventColor }}
            >
              {isFull ? (
                <>
                  {Icons.x}
                  Event is Full
                </>
              ) : (
                <>
                  {Icons.ticket}
                  Register Now
                  {Icons.arrowRight}
                </>
              )}
            </button>
            <button
              onClick={onPortalClick}
              className="block w-full py-3 px-6 rounded-xl font-medium text-center transition-all border-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              style={{ borderColor: eventColor, color: eventColor }}
            >
              Already registered? Access Portal
            </button>
          </div>
        )}

        {isVirtual && virtualLink && status === "in_progress" && (
          <a
            href={virtualLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 px-6 rounded-2xl font-semibold text-white text-lg text-center transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-3"
            style={{ backgroundColor: eventColor }}
          >
            <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
            Join Live Event
            {Icons.arrowRight}
          </a>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="px-6 md:px-8 lg:px-10 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              {Icons.document}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              About This Event
            </h2>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
              {description}
            </p>
          </div>
        </div>
      )}

      {/* Type-Specific Sections */}
      {fieldSections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="px-6 md:px-8 lg:px-10 pb-8 pt-8 border-t border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              {section.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h2>
          </div>
          <div className="space-y-6">
            {section.fields.map(({ field, value }, fieldIndex) => (
              <div key={fieldIndex}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  {field.label}
                </h3>
                <FieldValue field={field} value={value} eventColor={eventColor} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Organizer */}
      {(organizerName || contactName || contactEmail) && (
        <div className="px-6 md:px-8 lg:px-10 pb-8 pt-8 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${eventColor}15`, color: eventColor }}
            >
              {Icons.user}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Organizer
            </h2>
          </div>
          <div className="flex items-center gap-5 p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ backgroundColor: eventColor }}
            >
              {(organizerName || contactName || "O").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-lg">
                {organizerName || contactName || "Event Organizer"}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-sm hover:underline flex items-center gap-2"
                    style={{ color: eventColor }}
                  >
                    {Icons.mail}
                    {contactEmail}
                  </a>
                )}
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"
                  >
                    {Icons.phone}
                    {contactPhone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { tabIconMap };
