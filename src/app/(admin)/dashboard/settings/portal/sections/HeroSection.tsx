"use client";

import { useRef, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";

export default function HeroSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState("");

  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setBannerError("File size must be less than 10 MB"); return; }
    if (!file.type.startsWith("image/")) { setBannerError("Please select an image file"); return; }

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
      if (!res.ok) throw new Error(data.error || "Upload failed");
      set("banner_image_url", data.url);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleBannerRemove = () => {
    set("banner_image_url", "");
    setBannerError("");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  return (
    <CollapsibleSection title="Hero Section" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hero Headline</label>
        <input type="text" value={state.hero_headline || ""} onChange={(e) => set("hero_headline", e.target.value)}
          placeholder="Welcome to Our Organization" className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hero Subtitle</label>
        <textarea value={state.hero_subtitle || ""} onChange={(e) => set("hero_subtitle", e.target.value)}
          placeholder="Discover our upcoming events and get involved." rows={3} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hero Layout</label>
        <div className="flex gap-3">
          {(["centered", "left-aligned", "split"] as const).map((layout) => (
            <label key={layout} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="hero_layout" value={layout}
                checked={state.hero_layout === layout} onChange={() => set("hero_layout", layout)}
                className="text-brand-500 focus:ring-brand-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{layout.replace("-", " ")}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Background Image</label>
        {state.banner_image_url ? (
          <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.banner_image_url} alt="Background preview" className="w-full h-40 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={bannerUploading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors">Change</button>
              <button type="button" onClick={handleBannerRemove}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors">Remove</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={bannerUploading}
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
                <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload background image</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">Recommended: 1920 x 900 px (PNG, JPG, WEBP) &middot; Max 10 MB</span>
              </>
            )}
          </button>
        )}
        <input ref={bannerInputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleBannerUpload} />
        {bannerError && <p className="mt-1.5 text-sm text-red-500">{bannerError}</p>}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Events on Portal</label>
          <p className="text-xs text-gray-500 dark:text-gray-400">Display upcoming events on your portal landing page</p>
        </div>
        <button type="button" onClick={() => set("show_events", !state.show_events)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_events ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_events ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CTA Button Text</label>
          <input type="text" value={state.custom_cta_text || ""} onChange={(e) => set("custom_cta_text", e.target.value)}
            placeholder="View All Events" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CTA Button URL</label>
          <input type="text" value={state.custom_cta_url || ""} onChange={(e) => set("custom_cta_url", e.target.value)}
            placeholder="/events" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Secondary CTA Text</label>
          <input type="text" value={state.secondary_cta_text || ""} onChange={(e) => set("secondary_cta_text", e.target.value)}
            placeholder="Learn More" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Secondary CTA URL</label>
          <input type="text" value={state.secondary_cta_url || ""} onChange={(e) => set("secondary_cta_url", e.target.value)}
            placeholder="/about" className={inputClass} />
        </div>
      </div>
    </CollapsibleSection>
  );
}
