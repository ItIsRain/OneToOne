"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";

export default function ThemeSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  return (
    <CollapsibleSection title="Theme" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Accent Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={state.portal_accent_color || "#84cc16"}
            onChange={(e) => set("portal_accent_color", e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input type="text" value={state.portal_accent_color || ""} onChange={(e) => set("portal_accent_color", e.target.value)}
            placeholder="#84cc16" className={inputClass} />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Override the portal accent color. Leave empty to use your brand color.
        </p>
        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
          Tip: Use a dark accent color for better text visibility and a cleaner look on the portal landing page.
        </p>
      </div>
    </CollapsibleSection>
  );
}
