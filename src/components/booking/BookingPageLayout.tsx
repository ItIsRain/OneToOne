"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ServiceInfo } from "./ServiceInfo";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { BookingForm } from "./BookingForm";
import { BookingConfirmation } from "./BookingConfirmation";

interface BookingPageData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  location_type: "video" | "phone" | "in_person" | "custom";
  location_details: string | null;
  color: string;
  is_active: boolean;
  min_notice_hours: number;
  max_advance_days: number;
  availability: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }[];
  overrides: {
    override_date: string;
    is_blocked: boolean;
    start_time: string | null;
    end_time: string | null;
  }[];
}

interface TenantBranding {
  name: string | null;
  logo_url: string | null;
  subdomain: string | null;
}

interface AppointmentData {
  client_name: string;
  client_email: string;
  client_phone?: string;
  notes?: string;
  start_time: string;
  end_time: string;
}

interface BookingPageLayoutProps {
  slug: string;
}

export function BookingPageLayout({ slug }: BookingPageLayoutProps) {
  const [bookingPage, setBookingPage] = useState<BookingPageData | null>(null);
  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);

  useEffect(() => {
    async function fetchBookingPage() {
      try {
        const res = await fetch(`/api/book/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Booking page not found.");
          } else {
            setError("Something went wrong. Please try again later.");
          }
          return;
        }
        const data = await res.json();
        if (!data.bookingPage) {
          setError("This booking page is currently unavailable.");
          return;
        }
        setBookingPage({
          ...data.bookingPage,
          availability: data.availability || [],
          overrides: data.overrides || [],
        });
        if (data.tenant) {
          setTenant(data.tenant);
        }
      } catch {
        setError("Failed to load booking page. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchBookingPage();
  }, [slug]);

  const handleSelectSlot = useCallback(
    (date: string, startTime: string, endTime: string) => {
      setSelectedDate(date);
      setSelectedStartTime(startTime);
      setSelectedEndTime(endTime);
    },
    []
  );

  const handleContinueToForm = useCallback(() => {
    if (selectedDate && selectedStartTime && selectedEndTime) {
      setStep(2);
    }
  }, [selectedDate, selectedStartTime, selectedEndTime]);

  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  const handleSubmit = useCallback(
    async (data: {
      name: string;
      email: string;
      phone?: string;
      notes?: string;
    }) => {
      if (!bookingPage) return;
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/book/${slug}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_page_id: bookingPage.id,
            client_name: data.name,
            client_email: data.email,
            client_phone: data.phone,
            notes: data.notes,
            start_time: `${selectedDate}T${selectedStartTime}:00`,
            end_time: `${selectedDate}T${selectedEndTime}:00`,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(
            errData?.error || "Failed to book appointment. Please try again."
          );
        }
        const result = await res.json();
        setAppointment({
          client_name: data.name,
          client_email: data.email,
          client_phone: data.phone,
          notes: data.notes,
          start_time: result.start_time || `${selectedDate}T${selectedStartTime}`,
          end_time: result.end_time || `${selectedDate}T${selectedEndTime}`,
        });
        setStep(3);
      } catch (err) {
        alert(
          err instanceof Error
            ? err.message
            : "Failed to book appointment. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [bookingPage, slug, selectedDate, selectedStartTime, selectedEndTime]
  );

  const handleBookAnother = useCallback(() => {
    setStep(1);
    setSelectedDate("");
    setSelectedStartTime("");
    setSelectedEndTime("");
    setAppointment(null);
  }, []);

  const accentColor = bookingPage?.color || "#84cc16";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading booking page...
          </p>
        </div>
      </div>
    );
  }

  if (error || !bookingPage) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
        {/* Navbar on error page too */}
        <BrandedNavbar tenant={tenant} accentColor={accentColor} />
        <div className="flex flex-1 items-center justify-center">
          <div className="mx-4 max-w-md rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              {error || "Page not found"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please check the URL and try again.
            </p>
          </div>
        </div>
        <BrandedFooter tenant={tenant} accentColor={accentColor} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Branded Navbar */}
      <BrandedNavbar tenant={tenant} accentColor={accentColor} />

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg dark:bg-gray-900">
          {step === 1 && (
            <div>
              <ServiceInfo bookingPage={bookingPage} />
              <div className="p-6">
                <TimeSlotPicker
                  bookingPage={bookingPage}
                  availability={bookingPage.availability}
                  overrides={bookingPage.overrides}
                  onSelectSlot={handleSelectSlot}
                />
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleContinueToForm}
                    disabled={!selectedDate || !selectedStartTime}
                    className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor:
                        selectedDate && selectedStartTime
                          ? bookingPage.color
                          : undefined,
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <BookingForm
              bookingPage={bookingPage}
              selectedDate={selectedDate}
              selectedStartTime={selectedStartTime}
              selectedEndTime={selectedEndTime}
              onSubmit={handleSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}

          {step === 3 && appointment && (
            <BookingConfirmation
              bookingPage={bookingPage}
              appointment={appointment}
              onBookAnother={handleBookAnother}
            />
          )}
        </div>
      </div>

      {/* Branded Footer */}
      <BrandedFooter tenant={tenant} accentColor={accentColor} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Branded Navbar                                                      */
/* ------------------------------------------------------------------ */

function BrandedNavbar({
  tenant,
  accentColor,
}: {
  tenant: TenantBranding | null;
  accentColor: string;
}) {
  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {tenant?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt={tenant.name || "Logo"}
              className="h-8 max-w-[160px] object-contain dark:brightness-0 dark:invert"
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-sm"
              style={{ backgroundColor: accentColor }}
            >
              {tenant?.name ? tenant.name.charAt(0).toUpperCase() : "B"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: accentColor }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book Now
          </span>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Branded Footer                                                      */
/* ------------------------------------------------------------------ */

function BrandedFooter({
  tenant,
  accentColor,
}: {
  tenant: TenantBranding | null;
  accentColor: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          {tenant?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo_url}
              alt="Logo"
              className="h-5 max-w-[100px] object-contain opacity-60 dark:brightness-0 dark:invert"
            />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {`\u00A9 ${year} All rights reserved.`}
          </span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Powered by{" "}
          <span className="font-medium text-gray-500 dark:text-gray-400">
            OneToOne
          </span>
        </div>
      </div>
    </footer>
  );
}
