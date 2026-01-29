"use client";

import { useEffect, useState, useRef } from "react";

interface Testimonial {
  name: string;
  quote: string;
  role: string;
}

interface PortalSettings {
  id: string | null;
  hero_headline: string | null;
  hero_subtitle: string | null;
  banner_image_url: string | null;
  show_events: boolean;
  featured_event_ids: string[];
  custom_cta_text: string | null;
  custom_cta_url: string | null;
  hero_layout: string;
  show_about_section: boolean;
  about_heading: string | null;
  about_body: string | null;
  show_testimonials: boolean;
  testimonials: Testimonial[];
  secondary_cta_text: string | null;
  secondary_cta_url: string | null;
  show_footer: boolean;
  footer_text: string | null;
  section_order: string[];
  portal_accent_color: string | null;
}

export default function PortalSettingsClient() {
  const [settings, setSettings] = useState<PortalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state - Hero
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [heroLayout, setHeroLayout] = useState("centered");
  const [secondaryCtaText, setSecondaryCtaText] = useState("");
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState("");

  // Form state - About
  const [showAbout, setShowAbout] = useState(false);
  const [aboutHeading, setAboutHeading] = useState("");
  const [aboutBody, setAboutBody] = useState("");

  // Form state - Testimonials
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // Form state - Footer
  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState("");

  // Form state - Section Order
  const [sectionOrder, setSectionOrder] = useState<string[]>(["hero", "events", "about", "testimonials"]);

  // Form state - Theme
  const [accentColor, setAccentColor] = useState("");

  // Collapsible sections
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
      const s = data.settings as PortalSettings;
      setSettings(s);
      setHeadline(s.hero_headline || "");
      setSubtitle(s.hero_subtitle || "");
      setBannerUrl(s.banner_image_url || "");
      setShowEvents(s.show_events);
      setCtaText(s.custom_cta_text || "");
      setCtaUrl(s.custom_cta_url || "");
      setHeroLayout(s.hero_layout || "centered");
      setSecondaryCtaText(s.secondary_cta_text || "");
      setSecondaryCtaUrl(s.secondary_cta_url || "");
      setShowAbout(s.show_about_section || false);
      setAboutHeading(s.about_heading || "");
      setAboutBody(s.about_body || "");
      setShowTestimonials(s.show_testimonials || false);
      setTestimonials(s.testimonials || []);
      setShowFooter(s.show_footer !== false);
      setFooterText(s.footer_text || "");
      setSectionOrder(s.section_order || ["hero", "events", "about", "testimonials"]);
      setAccentColor(s.portal_accent_color || "");
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
          hero_headline: headline || null,
          hero_subtitle: subtitle || null,
          banner_image_url: bannerUrl || null,
          show_events: showEvents,
          featured_event_ids: settings?.featured_event_ids || [],
          custom_cta_text: ctaText || null,
          custom_cta_url: ctaUrl || null,
          hero_layout: heroLayout,
          show_about_section: showAbout,
          about_heading: aboutHeading || null,
          about_body: aboutBody || null,
          show_testimonials: showTestimonials,
          testimonials,
          secondary_cta_text: secondaryCtaText || null,
          secondary_cta_url: secondaryCtaUrl || null,
          show_footer: showFooter,
          footer_text: footerText || null,
          section_order: sectionOrder,
          portal_accent_color: accentColor || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      const data = await res.json();
      setSettings(data.settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  // Testimonial helpers
  const addTestimonial = () => {
    setTestimonials([...testimonials, { name: "", quote: "", role: "" }]);
  };

  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: string) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: value };
    setTestimonials(updated);
  };

  // Section order helpers
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const order = [...sectionOrder];
    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    setSectionOrder(order);
  };

  const moveSectionDown = (index: number) => {
    if (index >= sectionOrder.length - 1) return;
    const order = [...sectionOrder];
    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    setSectionOrder(order);
  };

  // Banner upload handler
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setBannerError("File size must be less than 10 MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setBannerError("Please select an image file");
      return;
    }

    setBannerUploading(true);
    setBannerError("");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/upload/portal-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setBannerUrl(data.url);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleBannerRemove = () => {
    setBannerUrl("");
    setBannerError("");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const sectionLabels: Record<string, string> = {
    hero: "Hero",
    events: "Events",
    about: "About",
    testimonials: "Testimonials",
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent";

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchSettings}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
          >
            Try again
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
            Portal settings saved successfully.
          </p>
        </div>
      )}

      {/* === Hero Section === */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("hero")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-left"
        >
          <span className="font-medium text-gray-800 dark:text-white">Hero Section</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.hero ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.hero && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Hero Headline
              </label>
              <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
                placeholder="Welcome to Our Organization" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Hero Subtitle
              </label>
              <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Discover our upcoming events and get involved." rows={3} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Hero Layout
              </label>
              <div className="flex gap-3">
                {(["centered", "left-aligned", "split"] as const).map((layout) => (
                  <label key={layout} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hero_layout"
                      value={layout}
                      checked={heroLayout === layout}
                      onChange={() => setHeroLayout(layout)}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {layout.replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Banner Image
              </label>
              {bannerUrl ? (
                <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerUrl} alt="Banner preview" className="w-full h-40 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={() => bannerInputRef.current?.click()}
                      disabled={bannerUploading}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors">
                      Change
                    </button>
                    <button type="button" onClick={handleBannerRemove}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  {bannerUploading ? (
                    <>
                      <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Click to upload banner image
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Recommended: 1920 x 900 px (PNG, JPG, WEBP) &middot; Max 10 MB
                      </span>
                    </>
                  )}
                </button>
              )}
              <input ref={bannerInputRef} type="file" className="hidden"
                accept="image/png,image/jpeg,image/webp" onChange={handleBannerUpload} />
              {bannerError && (
                <p className="mt-1.5 text-sm text-red-500">{bannerError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Events on Portal
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Display upcoming events on your portal landing page
                </p>
              </div>
              <button type="button" onClick={() => setShowEvents(!showEvents)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${showEvents ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${showEvents ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  CTA Button Text
                </label>
                <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)}
                  placeholder="View All Events" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  CTA Button URL
                </label>
                <input type="text" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="/events" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Secondary CTA Text
                </label>
                <input type="text" value={secondaryCtaText} onChange={(e) => setSecondaryCtaText(e.target.value)}
                  placeholder="Learn More" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Secondary CTA URL
                </label>
                <input type="text" value={secondaryCtaUrl} onChange={(e) => setSecondaryCtaUrl(e.target.value)}
                  placeholder="/about" className={inputClass} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === About Section === */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("about")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-left"
        >
          <span className="font-medium text-gray-800 dark:text-white">About Section</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.about ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.about && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable About Section
              </label>
              <button type="button" onClick={() => setShowAbout(!showAbout)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${showAbout ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${showAbout ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {showAbout && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    About Heading
                  </label>
                  <input type="text" value={aboutHeading} onChange={(e) => setAboutHeading(e.target.value)}
                    placeholder="About Us" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    About Body
                  </label>
                  <textarea value={aboutBody} onChange={(e) => setAboutBody(e.target.value)}
                    placeholder="Tell visitors about your organization..." rows={5} className={inputClass} />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* === Testimonials Section === */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("testimonials")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-left"
        >
          <span className="font-medium text-gray-800 dark:text-white">Testimonials</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.testimonials ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.testimonials && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Testimonials
              </label>
              <button type="button" onClick={() => setShowTestimonials(!showTestimonials)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${showTestimonials ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${showTestimonials ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {showTestimonials && (
              <>
                {testimonials.map((t, i) => (
                  <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Testimonial {i + 1}
                      </span>
                      <button onClick={() => removeTestimonial(i)}
                        className="text-sm text-red-500 hover:text-red-600">
                        Remove
                      </button>
                    </div>
                    <input type="text" value={t.name} onChange={(e) => updateTestimonial(i, "name", e.target.value)}
                      placeholder="Name" className={inputClass} />
                    <input type="text" value={t.role} onChange={(e) => updateTestimonial(i, "role", e.target.value)}
                      placeholder="Role / Title" className={inputClass} />
                    <textarea value={t.quote} onChange={(e) => updateTestimonial(i, "quote", e.target.value)}
                      placeholder="Their testimonial..." rows={2} className={inputClass} />
                  </div>
                ))}
                <button onClick={addTestimonial}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Testimonial
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* === Footer Section === */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("footer")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-left"
        >
          <span className="font-medium text-gray-800 dark:text-white">Footer</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.footer ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.footer && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Footer
              </label>
              <button type="button" onClick={() => setShowFooter(!showFooter)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${showFooter ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${showFooter ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {showFooter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Custom Footer Text
                </label>
                <input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)}
                  placeholder="© 2026 Your Company. All rights reserved." className={inputClass} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* === Section Order === */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("order")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-left"
        >
          <span className="font-medium text-gray-800 dark:text-white">Section Order</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.order ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.order && (
          <div className="p-4 space-y-2">
            {sectionOrder.map((section, index) => (
              <div key={section} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {sectionLabels[section] || section}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => moveSectionUp(index)} disabled={index === 0}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button onClick={() => moveSectionDown(index)} disabled={index === sectionOrder.length - 1}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === Theme === */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("theme")}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-left"
        >
          <span className="font-medium text-gray-800 dark:text-white">Theme</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.theme ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.theme && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor || "#84cc16"}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#84cc16" className={inputClass} />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Override the portal accent color. Leave empty to use your brand color.
              </p>
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                Tip: Use a dark accent color for better text visibility and a cleaner look on the portal landing page.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
