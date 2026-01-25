"use client";
import React, { useState } from "react";
import { NewEventModal } from "@/components/agency/modals";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const currentMonth = "February 2025";

const events = [
  { day: 5, title: "Team Meeting", color: "bg-brand-500" },
  { day: 12, title: "Product Launch", color: "bg-warning-500" },
  { day: 15, title: "Client Presentation", color: "bg-success-500" },
  { day: 20, title: "Annual Gala", color: "bg-error-500" },
  { day: 25, title: "Workshop", color: "bg-blue-light-500" },
];

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const daysInMonth = 28;
  const startDay = 6; // Saturday

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Calendar</h1>
            <p className="text-gray-500 dark:text-gray-400">View and manage your schedule</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Today
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Event
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <button className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{currentMonth}</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {days.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 rounded-lg" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const event = events.find((e) => e.day === day);
                return (
                  <div
                    key={day}
                    className="h-24 rounded-lg border border-gray-100 p-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">{day}</span>
                    {event && (
                      <div className={`mt-1 px-2 py-1 rounded text-xs text-white ${event.color} truncate`}>
                        {event.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <NewEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
