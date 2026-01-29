"use client";

import Link from "next/link";
import {
  DotPattern,
  ShimmerButton,
  GradientText,
  Spotlight,
  NumberTicker,
  BorderBeam,
} from "@/components/ui/magic";

interface Testimonial {
  name: string;
  quote: string;
  role: string;
}

interface PortalSettings {
  hero_headline: string | null;
  hero_subtitle: string | null;
  banner_image_url: string | null;
  show_events: boolean;
  custom_cta_text: string | null;
  custom_cta_url: string | null;
  hero_layout?: string;
  show_about_section?: boolean;
  about_heading?: string | null;
  about_body?: string | null;
  show_testimonials?: boolean;
  testimonials?: Testimonial[];
  secondary_cta_text?: string | null;
  secondary_cta_url?: string | null;
  section_order?: string[];
  portal_accent_color?: string | null;
}

interface EventItem {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  is_virtual: boolean;
  cover_image: string | null;
  category: string | null;
  event_type: string | null;
}

interface TenantPortalLandingProps {
  tenantName: string;
  logoUrl: string | null;
  primaryColor: string;
  portalSettings: PortalSettings | null;
  upcomingEvents: EventItem[];
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

function formatShortDate(dateStr: string | null): { month: string; day: string } {
  if (!dateStr) return { month: "", day: "" };
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
  };
}

/** Lighten or darken a hex color. amount > 0 = lighter, < 0 = darker */
function shiftColor(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function TenantPortalLanding({
  tenantName,
  primaryColor,
  portalSettings,
  upcomingEvents,
}: TenantPortalLandingProps) {
  const headline = portalSettings?.hero_headline || `Welcome to ${tenantName}`;
  const subtitle =
    portalSettings?.hero_subtitle || "Discover our upcoming events and get involved.";
  const bannerImage = portalSettings?.banner_image_url;
  const showEvents = portalSettings?.show_events !== false;
  const ctaText = portalSettings?.custom_cta_text || "View All Events";
  const ctaUrl = portalSettings?.custom_cta_url || "/events";
  const heroLayout = portalSettings?.hero_layout || "centered";
  const secondaryCtaText = portalSettings?.secondary_cta_text;
  const secondaryCtaUrl = portalSettings?.secondary_cta_url;
  const showAbout = portalSettings?.show_about_section || false;
  const aboutHeading = portalSettings?.about_heading || "About Us";
  const aboutBody = portalSettings?.about_body || "";
  const showTestimonials = portalSettings?.show_testimonials || false;
  const testimonials = portalSettings?.testimonials || [];
  const sectionOrder = portalSettings?.section_order || [
    "hero",
    "events",
    "about",
    "testimonials",
  ];
  const color = portalSettings?.portal_accent_color || primaryColor;
  const colorDark = shiftColor(color, -40);
  const colorLight = shiftColor(color, 60);

  /* ------------------------------------------------------------------ */
  /*  Hero                                                               */
  /* ------------------------------------------------------------------ */
  const renderHero = () => {
    const isCentered = heroLayout !== "left-aligned" && heroLayout !== "split";
    const textAlign = isCentered ? "text-center" : "text-left";
    const maxWidth = heroLayout === "split" ? "max-w-2xl" : "max-w-4xl mx-auto";

    return (
      <section
        key="hero"
        className={`relative overflow-hidden min-h-[85vh] flex items-center ${heroLayout === "split" ? "flex-row" : ""}`}
      >
        {/* Background */}
        {bannerImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bannerImage})` }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(145deg, ${colorDark}, ${color} 40%, ${colorDark} 80%)`,
            }}
          />
        )}

        {/* Dot pattern texture */}
        <DotPattern
          className="fill-white/[0.06]"
          width={24}
          height={24}
          cr={1}
        />

        {/* Spotlight */}
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill={`${colorLight}40`}
        />

        {/* Top radial glow */}
        {!bannerImage && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${color}50, transparent)`,
            }}
          />
        )}

        {/* Bottom fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Content */}
        <div className={`relative z-10 w-full py-32 lg:py-44 px-4 sm:px-6 lg:px-8 ${maxWidth} ${textAlign}`}>
          {/* Small label */}
          <div
            className={`animate-fade-in-up inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-semibold tracking-wide uppercase mb-10 ${
              isCentered ? "mx-auto" : ""
            }`}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: "#4ade80",
                boxShadow: "0 0 8px #4ade80",
              }}
            />
            {upcomingEvents.length > 0
              ? `${upcomingEvents.length} upcoming event${upcomingEvents.length > 1 ? "s" : ""}`
              : "Stay tuned for events"}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.05]">
            <GradientText
              colors={["#ffffff", "rgba(255,255,255,0.65)", "#ffffff"]}
              animationSpeed={6}
              className="inline"
            >
              {headline}
            </GradientText>
          </h1>

          {/* Subtitle */}
          <p
            className={`animate-fade-in-up delay-200 mt-7 text-lg sm:text-xl lg:text-2xl leading-relaxed text-white/70 font-light ${
              isCentered ? "max-w-2xl mx-auto" : "max-w-xl"
            }`}
          >
            {subtitle}
          </p>

          {/* CTAs */}
          <div className={`animate-fade-in-up delay-300 mt-12 flex flex-wrap gap-4 ${isCentered ? "justify-center" : ""}`}>
            <ShimmerButton
              background={`linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))`}
              shimmerColor="rgba(255,255,255,0.3)"
              shimmerSize="0.08em"
              borderRadius="16px"
              className="px-10 py-4.5 text-base font-semibold shadow-2xl shadow-black/20"
              onClick={() => { window.location.href = ctaUrl; }}
            >
              {ctaText}
              <svg className="w-4 h-4 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </ShimmerButton>
            {secondaryCtaText && secondaryCtaUrl && (
              <Link
                href={secondaryCtaUrl}
                className="inline-flex items-center px-10 py-4.5 font-semibold rounded-2xl border border-white/20 text-white/90 hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-sm"
              >
                {secondaryCtaText}
              </Link>
            )}
          </div>

          {/* Stats row — animated numbers */}
          {upcomingEvents.length > 0 && (
            <div className={`animate-fade-in-up delay-500 mt-20 flex flex-wrap gap-8 ${isCentered ? "justify-center" : ""}`}>
              {[
                {
                  label: "Upcoming Events",
                  value: upcomingEvents.length,
                  isNumber: true,
                },
                {
                  label: "Next Event",
                  textValue: upcomingEvents[0]?.start_date
                    ? new Date(upcomingEvents[0].start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "TBD",
                  isNumber: false,
                },
                {
                  label: "Format",
                  textValue: upcomingEvents.some((e) => e.is_virtual) ? "Hybrid" : "In-Person",
                  isNumber: false,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="px-6 py-4 rounded-2xl min-w-[120px]"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <p className="text-2xl font-bold text-white">
                    {stat.isNumber ? (
                      <NumberTicker value={stat.value!} duration={1200} />
                    ) : (
                      stat.textValue
                    )}
                  </p>
                  <p className="text-[11px] text-white/45 uppercase tracking-widest font-medium mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Events                                                             */
  /* ------------------------------------------------------------------ */
  const renderEvents = () => {
    if (!showEvents) return null;

    if (upcomingEvents.length === 0) {
      return (
        <section key="events" className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-md mx-auto">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${color}10` }}
              >
                <svg
                  className="w-10 h-10"
                  style={{ color }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                No upcoming events
              </h3>
              <p className="mt-3 text-gray-500 dark:text-gray-400">
                Check back soon for new events and updates.
              </p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section key="events" className="relative py-24 lg:py-32 bg-gray-50/70 dark:bg-gray-950/50 overflow-hidden">
        {/* Subtle background gradient */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[160px] pointer-events-none opacity-[0.07]"
          style={{ backgroundColor: color }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex items-end justify-between mb-14">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color }}
                >
                  Don&apos;t miss out
                </p>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                Upcoming Events
              </h2>
            </div>
            <Link
              href="/events"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                color,
                backgroundColor: `${color}10`,
              }}
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Event cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {upcomingEvents.map((event, idx) => {
              const sd = formatShortDate(event.start_date);
              const isFirst = idx === 0;

              return (
                <Link key={event.id} href={`/event/${event.slug || event.id}`}>
                  <div
                    className={`group relative h-full rounded-2xl border bg-white dark:bg-gray-900 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 ${
                      isFirst
                        ? "border-transparent"
                        : "border-gray-200/80 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                  >
                    {/* Border beam on first card */}
                    {isFirst && (
                      <BorderBeam
                        size={150}
                        duration={8}
                        colorFrom={color}
                        colorTo={colorLight}
                      />
                    )}

                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {event.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={event.cover_image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                          }}
                        >
                          <svg
                            className="w-12 h-12 opacity-30"
                            style={{ color }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                      )}

                      {/* Image overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Category badge */}
                      {(event.category || event.event_type) && (
                        <span
                          className="absolute top-3 left-3 px-3 py-1 text-[11px] font-bold rounded-full text-white uppercase tracking-wider"
                          style={{
                            backgroundColor: `${color}dd`,
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          {event.category || event.event_type}
                        </span>
                      )}

                      {/* Date badge */}
                      {event.start_date && (
                        <div
                          className="absolute top-3 right-3 flex flex-col items-center px-3 py-2 rounded-xl text-white"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <span className="text-[10px] font-bold uppercase leading-none tracking-wider">
                            {sd.month}
                          </span>
                          <span className="text-xl font-extrabold leading-tight">
                            {sd.day}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:opacity-80 transition-opacity line-clamp-2 leading-snug text-[15px]">
                        {event.title}
                      </h3>

                      <div className="mt-3 space-y-1.5">
                        {event.start_date && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <svg
                              className="w-3.5 h-3.5 flex-shrink-0"
                              style={{ color }}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {formatDate(event.start_date)} &middot;{" "}
                            {formatTime(event.start_date)}
                          </p>
                        )}

                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          {event.is_virtual ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5 flex-shrink-0"
                                style={{ color }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Virtual Event
                            </>
                          ) : event.location ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5 flex-shrink-0"
                                style={{ color }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {event.location}
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile view-all */}
          <div className="mt-10 text-center sm:hidden">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl"
              style={{ color, backgroundColor: `${color}10` }}
            >
              View All Events
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  About                                                              */
  /* ------------------------------------------------------------------ */
  const renderAbout = () => {
    if (!showAbout || !aboutBody) return null;

    return (
      <section key="about" className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute top-1/2 -translate-y-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[180px] pointer-events-none opacity-[0.05]"
          style={{ backgroundColor: color }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color }}
            >
              Get to know us
            </p>
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-10 tracking-tight">
            {aboutHeading}
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line max-w-3xl mx-auto">
            {aboutBody}
          </p>
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Testimonials — Marquee style                                       */
  /* ------------------------------------------------------------------ */
  const renderTestimonials = () => {
    if (!showTestimonials || testimonials.length === 0) return null;

    const TestimonialCard = ({ t }: { t: Testimonial }) => (
      <div
        className="flex-shrink-0 w-[360px] rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg"
      >
        {/* Quote */}
        <div className="flex gap-4 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}12` }}
          >
            <svg
              className="w-4 h-4"
              style={{ color }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed text-sm">
          &ldquo;{t.quote}&rdquo;
        </p>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: color }}
          >
            {t.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {t.name}
            </p>
            {t.role && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.role}
              </p>
            )}
          </div>
        </div>
      </div>
    );

    // If only a few testimonials, use static grid
    if (testimonials.length <= 3) {
      return (
        <section key="testimonials" className="py-24 lg:py-32 bg-gray-50/70 dark:bg-gray-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                  Testimonials
                </p>
                <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                What People Say
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, i) => (
                <TestimonialCard key={i} t={t} />
              ))}
            </div>
          </div>
        </section>
      );
    }

    // Grid layout for many testimonials
    return (
      <section key="testimonials" className="py-24 lg:py-32 bg-gray-50/70 dark:bg-gray-950/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                Testimonials
              </p>
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              What People Say
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} t={t} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Section ordering                                                   */
  /* ------------------------------------------------------------------ */
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    hero: renderHero,
    events: renderEvents,
    about: renderAbout,
    testimonials: renderTestimonials,
  };

  return (
    <div className="bg-white dark:bg-gray-950">
      {sectionOrder.map((section) => {
        const render = sectionRenderers[section];
        return render ? render() : null;
      })}
    </div>
  );
}
