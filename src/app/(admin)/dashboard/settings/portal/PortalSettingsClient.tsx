"use client";

import { useEffect, useReducer, useState } from "react";
import type { PortalSettings } from "@/types/portal";
import type { PortalAction } from "./sections";
import {
  HeroSection,
  AboutSection,
  TestimonialsSection,
  FooterSection,
  ServicesSection,
  FaqSection,
  CtaBannerSection,
  StatsSection,
  PartnersSection,
  SectionOrderPanel,
  ThemeSection,
} from "./sections";
import PortalPreviewPanel from "./PortalPreviewPanel";

const ALL_SECTION_KEYS = ["hero", "events", "about", "testimonials", "services", "faq", "cta_banner", "stats", "partners"];

const DEFAULT_SETTINGS: PortalSettings = {
  id: null,
  hero_headline: null,
  hero_subtitle: null,
  banner_image_url: null,
  show_events: true,
  featured_event_ids: [],
  custom_cta_text: null,
  custom_cta_url: null,
  hero_layout: "centered",
  show_about_section: false,
  about_heading: null,
  about_body: null,
  show_testimonials: false,
  testimonials: [],
  secondary_cta_text: null,
  secondary_cta_url: null,
  show_footer: true,
  footer_text: null,
  section_order: ALL_SECTION_KEYS,
  portal_accent_color: null,
  show_services: false,
  services_heading: null,
  services_subheading: null,
  services: [],
  show_faq: false,
  faq_heading: null,
  faq_items: [],
  show_cta_banner: false,
  cta_banner_heading: null,
  cta_banner_body: null,
  cta_banner_button_text: null,
  cta_banner_button_url: null,
  show_stats: false,
  stats_heading: null,
  stats: [],
  show_partners: false,
  partners_heading: null,
  partners: [],
  login_methods: ["password", "magic_link"],
  login_welcome_message: null,
  require_approval_comment: false,
  approval_notification_email: null,
};

function portalReducer(state: PortalSettings, action: PortalAction): PortalSettings {
  switch (action.type) {
    case "SET_ALL":
      return { ...action.payload };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

/** Ensure all known sections are present in section_order */
function ensureSectionOrder(order: string[]): string[] {
  const result = [...order];
  for (const key of ALL_SECTION_KEYS) {
    if (!result.includes(key)) result.push(key);
  }
  return result;
}

/* ── Section icons (inline SVGs) ── */
const icons = {
  hero: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75zm-1.683 6.443l-.005.005-.006-.005.006-.005.005.005zm-.005 2.127l-.005-.006.005-.005.005.005-.005.006zm2.116-2.127l-.006.005-.005-.005.005-.005.006.005zm-.006 2.127l-.005-.006.005-.005.006.005-.006.006z" />
    </svg>
  ),
  about: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  testimonials: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  services: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  faq: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  cta_banner: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  ),
  stats: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  partners: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  footer: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h17.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 012.25 16.875v-9.75zM3.75 15.75h16.5" />
    </svg>
  ),
  order: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
    </svg>
  ),
  theme: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  ),
} as const;

const descriptions: Record<string, string> = {
  hero: "Banner headline, subtitle, background, and call-to-action buttons",
  about: "Tell visitors about your organization",
  testimonials: "Showcase testimonials from members or clients",
  services: "Highlight your key services or offerings",
  faq: "Answer commonly asked questions",
  cta_banner: "Add a call-to-action banner section",
  stats: "Display key statistics and impact metrics",
  partners: "Feature partner or sponsor logos",
  footer: "Customize footer text and links",
  order: "Rearrange the order of landing page sections",
  theme: "Accent color and branding customization",
};

/** Map section key -> the state key that indicates if it's enabled */
const enabledStateKeys: Record<string, keyof PortalSettings> = {
  about: "show_about_section",
  testimonials: "show_testimonials",
  services: "show_services",
  faq: "show_faq",
  cta_banner: "show_cta_banner",
  stats: "show_stats",
  partners: "show_partners",
  footer: "show_footer",
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
        active
          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
      {active ? "Active" : "Off"}
    </span>
  );
}

export default function PortalSettingsClient() {
  const [state, dispatch] = useReducer(portalReducer, DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hero: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/settings/portal");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      const s = data.settings;
      dispatch({
        type: "SET_ALL",
        payload: {
          ...DEFAULT_SETTINGS,
          ...s,
          section_order: ensureSectionOrder(s.section_order || ALL_SECTION_KEYS),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await fetch("/api/settings/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero_headline: state.hero_headline || null,
          hero_subtitle: state.hero_subtitle || null,
          banner_image_url: state.banner_image_url || null,
          show_events: state.show_events,
          featured_event_ids: state.featured_event_ids || [],
          custom_cta_text: state.custom_cta_text || null,
          custom_cta_url: state.custom_cta_url || null,
          hero_layout: state.hero_layout,
          show_about_section: state.show_about_section,
          about_heading: state.about_heading || null,
          about_body: state.about_body || null,
          show_testimonials: state.show_testimonials,
          testimonials: state.testimonials,
          secondary_cta_text: state.secondary_cta_text || null,
          secondary_cta_url: state.secondary_cta_url || null,
          show_footer: state.show_footer,
          footer_text: state.footer_text || null,
          section_order: state.section_order,
          portal_accent_color: state.portal_accent_color || null,
          show_services: state.show_services,
          services_heading: state.services_heading || null,
          services_subheading: state.services_subheading || null,
          services: state.services,
          show_faq: state.show_faq,
          faq_heading: state.faq_heading || null,
          faq_items: state.faq_items,
          show_cta_banner: state.show_cta_banner,
          cta_banner_heading: state.cta_banner_heading || null,
          cta_banner_body: state.cta_banner_body || null,
          cta_banner_button_text: state.cta_banner_button_text || null,
          cta_banner_button_url: state.cta_banner_button_url || null,
          show_stats: state.show_stats,
          stats_heading: state.stats_heading || null,
          stats: state.stats,
          show_partners: state.show_partners,
          partners_heading: state.partners_heading || null,
          partners: state.partners,
          login_methods: state.login_methods || ["password", "magic_link"],
          login_welcome_message: state.login_welcome_message || null,
          require_approval_comment: state.require_approval_comment || false,
          approval_notification_email: state.approval_notification_email || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      const data = await res.json();
      dispatch({
        type: "SET_ALL",
        payload: {
          ...DEFAULT_SETTINGS,
          ...data.settings,
          section_order: ensureSectionOrder(data.settings.section_order || ALL_SECTION_KEYS),
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent";

  const sectionProps = (key: string) => {
    const enabledKey = enabledStateKeys[key];
    return {
      state,
      dispatch,
      expanded: !!expandedSections[key],
      onToggle: () => toggleSection(key),
      inputClass,
      icon: icons[key as keyof typeof icons],
      description: descriptions[key],
      statusBadge: enabledKey ? <StatusBadge active={!!state[enabledKey]} /> : undefined,
    };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Settings Form - Left Panel */}
      <div className="w-full xl:w-[55%] space-y-3 pb-20">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={fetchSettings} className="mt-2 text-sm text-red-600 dark:text-red-400 underline">
              Try again
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Portal settings saved successfully.</p>
          </div>
        )}

        {/* Page Content Group */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1 pt-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Page Content</h3>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>
          <HeroSection {...sectionProps("hero")} />
          <AboutSection {...sectionProps("about")} />
          <TestimonialsSection {...sectionProps("testimonials")} />
          <ServicesSection {...sectionProps("services")} />
          <FaqSection {...sectionProps("faq")} />
          <CtaBannerSection {...sectionProps("cta_banner")} />
          <StatsSection {...sectionProps("stats")} />
          <PartnersSection {...sectionProps("partners")} />
        </div>

        {/* Layout & Appearance Group */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Layout & Appearance</h3>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>
          <FooterSection {...sectionProps("footer")} />
          <SectionOrderPanel {...sectionProps("order")} />
          <ThemeSection {...sectionProps("theme")} />
        </div>
      </div>

      {/* Live Preview - Right Panel (desktop only) */}
      <div className="hidden xl:block xl:w-[45%]">
        <div className="sticky top-4 h-[calc(100vh-8rem)] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <PortalPreviewPanel
            settings={state}
            tenantName="Your Organization"
            primaryColor={state.portal_accent_color || "#84cc16"}
          />
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 xl:right-[45%] z-40 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-6 py-3 max-w-full">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="xl:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preview
          </button>
          <div className="xl:flex-1" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>

      {/* Mobile Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm xl:hidden">
          <div className="w-full h-full max-w-4xl max-h-[90vh] m-4 bg-white dark:bg-gray-900 rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-800 dark:text-white">Portal Preview</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PortalPreviewPanel
                settings={state}
                tenantName="Your Organization"
                primaryColor={state.portal_accent_color || "#84cc16"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
