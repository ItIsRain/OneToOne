"use client";

import React, { useState, useMemo } from "react";

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Override {
  override_date: string;
  is_blocked: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface TimeSlotPickerProps {
  bookingPage: {
    duration_minutes: number;
    color: string;
    min_notice_hours: number;
    max_advance_days: number;
  };
  availability: Availability[];
  overrides: Override[];
  onSelectSlot: (date: string, startTime: string, endTime: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatTime12h(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${ampm}`;
}

function addMinutes(time24: string, minutes: number): string {
  const [h, m] = time24.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function timeToMinutes(time24: string): number {
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function TimeSlotPicker({
  bookingPage,
  availability,
  overrides,
  onSelectSlot,
}: TimeSlotPickerProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + bookingPage.min_notice_hours);
    return d;
  }, [bookingPage.min_notice_hours]);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + bookingPage.max_advance_days);
    return d;
  }, [bookingPage.max_advance_days]);

  const isDateDisabled = (dateStr: string): boolean => {
    const date = new Date(dateStr + "T00:00:00");
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (date < todayStart) return true;
    if (date > maxDate) return true;

    // Check min notice: if date is today, we handle slot-level filtering
    // But if the entire day is before min notice, disable it
    const endOfDay = new Date(dateStr + "T23:59:59");
    if (endOfDay < minDate) return true;

    return false;
  };

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const date = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = date.getDay();

    // Check overrides first
    const override = overrides.find((o) => o.override_date === selectedDate);
    if (override) {
      if (override.is_blocked) return [];
      if (override.start_time && override.end_time) {
        return generateSlots(
          override.start_time,
          override.end_time,
          bookingPage.duration_minutes
        );
      }
    }

    // Check weekly availability
    const dayAvailability = availability.filter(
      (a) => a.day_of_week === dayOfWeek && a.is_available
    );

    if (dayAvailability.length === 0) return [];

    const slots: { start: string; end: string }[] = [];
    for (const block of dayAvailability) {
      slots.push(
        ...generateSlots(block.start_time, block.end_time, bookingPage.duration_minutes)
      );
    }

    // Filter out slots that are before min notice time
    return slots.filter((slot) => {
      const slotDate = new Date(`${selectedDate}T${slot.start}:00`);
      return slotDate >= minDate;
    });
  }, [selectedDate, availability, overrides, bookingPage.duration_minutes, minDate]);

  function generateSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number
  ): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];
    const endMinutes = timeToMinutes(endTime);
    let current = startTime;

    while (timeToMinutes(current) + durationMinutes <= endMinutes) {
      const slotEnd = addMinutes(current, durationMinutes);
      slots.push({ start: current, end: slotEnd });
      current = slotEnd;
    }

    return slots;
  }

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot("");
  };

  const handleSlotClick = (slot: { start: string; end: string }) => {
    const key = `${slot.start}-${slot.end}`;
    setSelectedSlot(key);
    onSelectSlot(selectedDate, slot.start, slot.end);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push(dateStr);
  }

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
        Select a Date &amp; Time
      </h2>

      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Calendar */}
        <div className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Previous month"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Next month"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map((day) => (
              <div
                key={day}
                className="pb-1 text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} />;
              }
              const dayNum = parseInt(dateStr.split("-")[2], 10);
              const disabled = isDateDisabled(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === toDateString(today);

              return (
                <button
                  key={dateStr}
                  onClick={() => !disabled && handleDateClick(dateStr)}
                  disabled={disabled}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                    disabled
                      ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                      : isSelected
                        ? "font-semibold text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  } ${isToday && !isSelected ? "font-semibold" : ""}`}
                  style={
                    isSelected
                      ? { backgroundColor: bookingPage.color }
                      : undefined
                  }
                >
                  {dayNum}
                  {isToday && !isSelected && (
                    <span
                      className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                      style={{ backgroundColor: bookingPage.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="flex-1">
          {!selectedDate ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Select a date to view available times
              </p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No available times for this date
              </p>
            </div>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {timeSlots.map((slot) => {
                const key = `${slot.start}-${slot.end}`;
                const isSlotSelected = selectedSlot === key;

                return (
                  <button
                    key={key}
                    onClick={() => handleSlotClick(slot)}
                    className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                      isSlotSelected
                        ? "border-transparent text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
                    }`}
                    style={
                      isSlotSelected
                        ? { backgroundColor: bookingPage.color }
                        : undefined
                    }
                  >
                    {formatTime12h(slot.start)} - {formatTime12h(slot.end)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
