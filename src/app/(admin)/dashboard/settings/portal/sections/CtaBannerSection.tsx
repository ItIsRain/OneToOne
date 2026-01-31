"use client";

import CollapsibleSection from "./CollapsibleSection";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import type { SectionProps } from "./types";

export default function CtaBannerSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  return (
    <CollapsibleSection title="CTA Banner" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable CTA Banner</label>
        <button type="button" onClick={() => set("show_cta_banner", !state.show_cta_banner)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_cta_banner ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_cta_banner ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {state.show_cta_banner && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Banner Heading</label>
            <input type="text" value={state.cta_banner_heading || ""} onChange={(e) => set("cta_banner_heading", e.target.value)}
              placeholder="Ready to get started?" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Banner Body</label>
            <MarkdownEditor
              value={state.cta_banner_body || ""}
              onChange={(v) => set("cta_banner_body", v)}
              placeholder="Write your call-to-action message..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Button Text</label>
              <input type="text" value={state.cta_banner_button_text || ""} onChange={(e) => set("cta_banner_button_text", e.target.value)}
                placeholder="Get Started" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Button URL</label>
              <input type="text" value={state.cta_banner_button_url || ""} onChange={(e) => set("cta_banner_button_url", e.target.value)}
                placeholder="/signup" className={inputClass} />
            </div>
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}
