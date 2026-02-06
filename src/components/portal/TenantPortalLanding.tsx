"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  DotPattern,
  ShimmerButton,
  GradientText,
  Spotlight,
  NumberTicker,
  BorderBeam,
} from "@/components/ui/magic";
import { renderMarkdown } from "@/lib/markdown";
import type {
  PortalSettings,
  Testimonial,
  ServiceItem,
  FaqItem,
  StatItem,
  PartnerItem,
} from "@/types/portal";

/* ------------------------------------------------------------------ */
/*  URL Safety Check - prevents XSS and open redirects                  */
/* ------------------------------------------------------------------ */
function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  // Allow relative paths (but not protocol-relative URLs like //evil.com)
  const isRelativePath = trimmed.startsWith("/") && !trimmed.startsWith("//");
  // Allow HTTPS URLs only (not http:// or other protocols)
  const isHttps = trimmed.startsWith("https://");
  // Block dangerous protocols
  const hasDangerousProtocol = /^(javascript|data|vbscript|file):/i.test(trimmed);
  return (isRelativePath || isHttps) && !hasDangerousProtocol;
}

/* ------------------------------------------------------------------ */
/*  ScrollReveal – fade-in on scroll using IntersectionObserver        */
/* ------------------------------------------------------------------ */
function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
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
  previewMode?: boolean;
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
  logoUrl,
  primaryColor,
  portalSettings,
  upcomingEvents,
  previewMode = false,
}: TenantPortalLandingProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (previewMode) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [previewMode]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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

  // New sections
  const showServices = portalSettings?.show_services || false;
  const servicesHeading = portalSettings?.services_heading || "Our Services";
  const servicesSubheading = portalSettings?.services_subheading || "";
  const services: ServiceItem[] = portalSettings?.services || [];
  const showFaq = portalSettings?.show_faq || false;
  const faqHeading = portalSettings?.faq_heading || "Frequently Asked Questions";
  const faqItems: FaqItem[] = portalSettings?.faq_items || [];
  const showCtaBanner = portalSettings?.show_cta_banner || false;
  const ctaBannerHeading = portalSettings?.cta_banner_heading || "";
  const ctaBannerBody = portalSettings?.cta_banner_body || "";
  const ctaBannerButtonText = portalSettings?.cta_banner_button_text || "";
  const ctaBannerButtonUrl = portalSettings?.cta_banner_button_url || "";
  const showStats = portalSettings?.show_stats || false;
  const statsHeading = portalSettings?.stats_heading || "Our Impact";
  const statsItems: StatItem[] = portalSettings?.stats || [];
  const showPartners = portalSettings?.show_partners || false;
  const partnersHeading = portalSettings?.partners_heading || "Our Partners";
  const partners: PartnerItem[] = portalSettings?.partners || [];
  const showFooter = portalSettings?.show_footer !== false;
  const footerText = portalSettings?.footer_text || "";

  /* ------------------------------------------------------------------ */
  /*  Navbar – sticky glassmorphism                                      */
  /* ------------------------------------------------------------------ */
  const navSections = sectionOrder
    .filter((s) => s !== "hero")
    .filter((s) => {
      if (s === "events" && !showEvents) return false;
      if (s === "about" && (!showAbout || !aboutBody)) return false;
      if (s === "testimonials" && (!showTestimonials || testimonials.length === 0)) return false;
      if (s === "services" && (!showServices || services.length === 0)) return false;
      if (s === "faq" && (!showFaq || faqItems.length === 0)) return false;
      if (s === "cta_banner" && (!showCtaBanner || !ctaBannerHeading)) return false;
      if (s === "stats" && (!showStats || statsItems.length === 0)) return false;
      if (s === "partners" && (!showPartners || partners.length === 0)) return false;
      return true;
    });

  const sectionLabels: Record<string, string> = {
    events: "Events",
    about: aboutHeading || "About",
    testimonials: "Testimonials",
    services: servicesHeading || "Services",
    faq: "FAQ",
    cta_banner: "Get Started",
    stats: statsHeading || "Stats",
    partners: partnersHeading || "Partners",
  };

  const renderNavbar = () => {
    if (previewMode || navSections.length === 0) return null;

    return (
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.72)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 24px rgba(0,0,0,0.04)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Tenant name */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 font-bold text-sm tracking-tight transition-colors duration-300"
              style={{ color: scrolled ? color : "white" }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={tenantName}
                  className="h-10 max-w-[180px] object-contain"
                />
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-extrabold"
                    style={{ backgroundColor: color }}
                  >
                    {tenantName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{tenantName}</span>
                </>
              )}
            </button>

            {/* Section links */}
            <div className="hidden md:flex items-center gap-1">
              {navSections.map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(`section-${section}`)}
                  className="px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-300 hover:scale-[1.04]"
                  style={{
                    color: scrolled ? "#374151" : "rgba(255,255,255,0.85)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = scrolled
                      ? `${color}10`
                      : "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {sectionLabels[section] || section}
                </button>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/login"
              className="px-5 py-2 text-[13px] font-semibold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: scrolled ? color : "rgba(255,255,255,0.15)",
                color: scrolled ? "white" : "rgba(255,255,255,0.95)",
                backdropFilter: scrolled ? "none" : "blur(12px)",
                border: scrolled ? "none" : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>
    );
  };

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
        id="section-hero"
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
        {!previewMode && (
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill={`${colorLight}40`}
          />
        )}

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

          {/* Subtitle - XSS-safe: renderMarkdown() escapes all HTML before transformation */}
          <div
            className={`animate-fade-in-up delay-200 mt-7 text-lg sm:text-xl lg:text-2xl leading-relaxed text-white/70 font-light [&_strong]:font-semibold [&_strong]:text-white/90 [&_em]:italic [&_a]:underline [&_a]:text-white/80 ${
              isCentered ? "max-w-2xl mx-auto" : "max-w-xl"
            }`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(subtitle) }}
          />

          {/* CTAs */}
          <div className={`animate-fade-in-up delay-300 mt-12 flex flex-wrap gap-4 ${isCentered ? "justify-center" : ""}`}>
            <ShimmerButton
              background={`linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))`}
              shimmerColor={previewMode ? "transparent" : "rgba(255,255,255,0.3)"}
              shimmerSize="0.08em"
              borderRadius="16px"
              className="px-10 py-4.5 text-base font-semibold shadow-2xl shadow-black/20"
              onClick={() => {
                if (!previewMode && isSafeUrl(ctaUrl)) {
                  window.location.href = ctaUrl;
                }
              }}
            >
              {ctaText}
              <svg className="w-4 h-4 ml-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </ShimmerButton>
            {secondaryCtaText && secondaryCtaUrl && isSafeUrl(secondaryCtaUrl) && (
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
        <section key="events" id="section-events" className="py-24 lg:py-32">
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
      <section key="events" id="section-events" className="relative py-24 lg:py-32 bg-gray-50/70 dark:bg-gray-950/50 overflow-hidden">
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
      <section key="about" id="section-about" className="relative py-24 lg:py-32 overflow-hidden">
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
          {/* XSS-safe: renderMarkdown() calls escapeHtml() on all input before any transformation.
              No raw user HTML can pass through — only escaped markdown syntax is converted. */}
          <div
            className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto [&_strong]:font-bold [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_em]:italic [&_a]:underline [&_a]:hover:opacity-80 [&_ul]:text-left [&_ul]:mt-4 [&_ul]:space-y-2"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(aboutBody) }}
          />
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
        <section key="testimonials" id="section-testimonials" className="py-24 lg:py-32 bg-gray-50/70 dark:bg-gray-950/50">
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
                <TestimonialCard key={`testimonial-${i}-${t.name || ''}-${t.role || ''}`} t={t} />
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
              <TestimonialCard key={`testimonial-${i}-${t.name || ''}-${t.role || ''}`} t={t} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Services                                                           */
  /* ------------------------------------------------------------------ */
  const serviceIconMap: Record<string, React.ReactNode> = {
    rocket: <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />,
    shield: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
    globe: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />,
    zap: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
    target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    layers: <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25" />,
    award: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></>,
    cpu: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />,
  };

  const renderServices = () => {
    if (!showServices || services.length === 0) return null;

    return (
      <section key="services" id="section-services" className="relative py-24 lg:py-32 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[160px] pointer-events-none opacity-[0.05]"
          style={{ backgroundColor: color }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                {servicesSubheading || "What we offer"}
              </p>
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              {servicesHeading}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.map((service, i) => (
              <div
                key={`service-${i}-${service.title || ''}`}
                className="group relative rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-7 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 20%, ${color}08, transparent 60%)` }}
                />
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${color}12` }}
                  >
                    <svg className="w-6 h-6" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {serviceIconMap[service.icon] || serviceIconMap.star}
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  FAQ                                                                */
  /* ------------------------------------------------------------------ */
  const renderFaq = () => {
    if (!showFaq || faqItems.length === 0) return null;

    return (
      <section key="faq" id="section-faq" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>FAQ</p>
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              {faqHeading}
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={`faq-${i}-${(item.question || '').slice(0, 30)}`}
                  className={`rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? "shadow-sm" : ""}`}
                >
                  <div className={`border rounded-xl overflow-hidden transition-colors duration-300 bg-white dark:bg-gray-900 ${isOpen ? "border-gray-200 dark:border-gray-700" : "border-gray-200/60 dark:border-gray-800/60"}`}>
                    {/* Accent left border when open */}
                    <div className="flex">
                      <div
                        className="w-1 flex-shrink-0 transition-all duration-300 rounded-l-xl"
                        style={{ backgroundColor: isOpen ? color : "transparent" }}
                      />
                      <div className="flex-1">
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                          className="w-full flex items-center justify-between px-6 py-5 text-left"
                        >
                          <span className="font-semibold text-gray-900 dark:text-white pr-4">{item.question}</span>
                          <div
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300"
                            style={{ backgroundColor: isOpen ? `${color}18` : `${color}08` }}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                              style={{ color }}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        {/* Animated content area using grid trick */}
                        <div
                          className="grid transition-all duration-300 ease-in-out"
                          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                        >
                          <div className="overflow-hidden">
                            <div className="px-6 pb-5">
                              {/* XSS-safe: renderMarkdown() escapes all HTML before transformation */}
                              <div
                                className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-none [&_strong]:font-bold [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_em]:italic [&_a]:underline"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(item.answer) }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  CTA Banner                                                         */
  /* ------------------------------------------------------------------ */
  const renderCtaBanner = () => {
    if (!showCtaBanner || !ctaBannerHeading) return null;

    return (
      <section key="cta_banner" id="section-cta_banner" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative rounded-3xl overflow-hidden px-8 py-16 sm:px-16 sm:py-24 text-center"
            style={{ background: `linear-gradient(145deg, ${colorDark}, ${color} 50%, ${shiftColor(color, -20)} 100%)` }}
          >
            <DotPattern className="fill-white/[0.06]" width={20} height={20} cr={1} />
            {/* Radial glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${colorLight}20, transparent)`,
              }}
            />
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
                {ctaBannerHeading}
              </h2>
              {ctaBannerBody && (
                /* XSS-safe: renderMarkdown() escapes all HTML before transformation */
                <div
                  className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto mb-10 [&_strong]:font-bold [&_strong]:text-white [&_em]:italic [&_a]:underline [&_a]:text-white"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(ctaBannerBody) }}
                />
              )}
              {ctaBannerButtonText && ctaBannerButtonUrl && (
                <Link
                  href={ctaBannerButtonUrl}
                  className="inline-flex items-center px-8 py-4 font-semibold rounded-2xl bg-white text-gray-900 hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-black/10"
                >
                  {ctaBannerButtonText}
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Stats                                                              */
  /* ------------------------------------------------------------------ */
  const renderStats = () => {
    if (!showStats || statsItems.length === 0) return null;

    const gridColsMap: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
    };
    const gridCols = statsItems.length <= 3
      ? gridColsMap[statsItems.length] || "grid-cols-3"
      : "grid-cols-2 lg:grid-cols-4";

    return (
      <section key="stats" id="section-stats" className="relative py-24 lg:py-32 bg-gray-50/70 dark:bg-gray-950/50 overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[180px] pointer-events-none opacity-[0.06]"
          style={{ backgroundColor: color }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>By the numbers</p>
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              {statsHeading}
            </h2>
          </div>

          <div className={`grid gap-6 max-w-4xl mx-auto ${gridCols}`}>
            {statsItems.map((stat, i) => {
              const numericValue = parseInt(stat.value, 10);
              const isNumeric = !isNaN(numericValue);

              return (
                <div
                  key={`stat-${i}-${stat.label || ''}`}
                  className="group relative rounded-2xl p-8 text-center overflow-hidden border border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700"
                >
                  {/* Subtle gradient on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${color}08, transparent 70%)` }}
                  />
                  <div className="relative z-10">
                    <p className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white">
                      {isNumeric && !previewMode ? (
                        <NumberTicker value={numericValue} duration={1200} />
                      ) : (
                        stat.value
                      )}
                      {stat.suffix && <span style={{ color }}>{stat.suffix}</span>}
                    </p>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Partners                                                           */
  /* ------------------------------------------------------------------ */
  const renderPartners = () => {
    if (!showPartners || partners.length === 0) return null;

    return (
      <section key="partners" id="section-partners" className="relative py-24 lg:py-32 bg-gray-50/70 dark:bg-gray-950/50 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>Trusted by</p>
              <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              {partnersHeading}
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            {partners.map((partner, i) => (
              <a
                key={`partner-${i}-${partner.name || ''}`}
                href={partner.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 px-6 py-4 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-800 hover:bg-white dark:hover:bg-gray-900 transition-all duration-300"
              >
                {partner.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="h-10 w-auto max-w-[140px] object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-400"
                  />
                ) : (
                  <div className="h-10 flex items-center justify-center text-base font-bold text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors tracking-tight">
                    {partner.name}
                  </div>
                )}
              </a>
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
    services: renderServices,
    faq: renderFaq,
    cta_banner: renderCtaBanner,
    stats: renderStats,
    partners: renderPartners,
  };

  /* ------------------------------------------------------------------ */
  /*  Footer (always at bottom, not in section order)                    */
  /* ------------------------------------------------------------------ */
  const renderFooter = () => {
    if (!showFooter) return null;

    return (
      <footer className="relative border-t border-gray-200/80 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/80">
        {/* Accent top line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Top row: branding + nav links */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={tenantName} className="h-10 max-w-[180px] object-contain" />
                ) : (
                  <>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-extrabold"
                      style={{ backgroundColor: color }}
                    >
                      {tenantName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                      {tenantName}
                    </span>
                  </>
                )}
              </div>
              {footerText && (
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {footerText}
                </p>
              )}
            </div>

            {/* Quick links */}
            {navSections.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                  Quick Links
                </p>
                <ul className="space-y-2.5">
                  {navSections.map((section) => (
                    <li key={section}>
                      <button
                        onClick={() => scrollToSection(`section-${section}`)}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                      >
                        {sectionLabels[section] || section}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200/80 dark:bg-gray-800/80 mb-8" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              &copy; {new Date().getFullYear()} {tenantName}. All rights reserved.
            </p>
            <p className="text-[11px] text-gray-300 dark:text-gray-700">
              Powered by OneToOne
            </p>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-950">
      {renderNavbar()}
      {sectionOrder.map((section) => {
        const render = sectionRenderers[section];
        if (!render) return null;
        const content = render();
        if (!content) return null;
        // Hero renders its own animations; wrap other sections in ScrollReveal
        if (section === "hero") return content;
        return (
          <ScrollReveal key={`reveal-${section}`}>
            {content}
          </ScrollReveal>
        );
      })}
      {renderFooter()}
    </div>
  );
}
