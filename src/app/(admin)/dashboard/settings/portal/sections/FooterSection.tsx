"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";

export default function FooterSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  return (
    <CollapsibleSection title="Footer" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Footer</label>
        <button type="button" onClick={() => set("show_footer", !state.show_footer)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_footer ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_footer ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {state.show_footer && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Custom Footer Text</label>
          <input type="text" value={state.footer_text || ""} onChange={(e) => set("footer_text", e.target.value)}
            placeholder="© 2026 Your Company. All rights reserved." className={inputClass} />
        </div>
      )}
    </CollapsibleSection>
  );
}
