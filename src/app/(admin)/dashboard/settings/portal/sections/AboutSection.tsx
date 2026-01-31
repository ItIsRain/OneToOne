"use client";

import CollapsibleSection from "./CollapsibleSection";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import type { SectionProps } from "./types";

export default function AboutSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  return (
    <CollapsibleSection title="About Section" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable About Section</label>
        <button type="button" onClick={() => set("show_about_section", !state.show_about_section)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_about_section ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_about_section ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {state.show_about_section && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">About Heading</label>
            <input type="text" value={state.about_heading || ""} onChange={(e) => set("about_heading", e.target.value)}
              placeholder="About Us" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">About Body</label>
            <MarkdownEditor
              value={state.about_body || ""}
              onChange={(v) => set("about_body", v)}
              placeholder="Tell visitors about your organization..."
              rows={5}
            />
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}
