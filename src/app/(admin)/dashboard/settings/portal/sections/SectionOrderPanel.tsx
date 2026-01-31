"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";

const ALL_SECTION_KEYS = ["hero", "events", "about", "testimonials", "services", "faq", "cta_banner", "stats", "partners"];

const sectionLabels: Record<string, string> = {
  hero: "Hero",
  events: "Events",
  about: "About",
  testimonials: "Testimonials",
  services: "Services",
  faq: "FAQ",
  cta_banner: "CTA Banner",
  stats: "Stats",
  partners: "Partners",
};

export default function SectionOrderPanel({ state, dispatch, expanded, onToggle, icon, description, statusBadge }: SectionProps) {
  const sectionOrder = state.section_order || ALL_SECTION_KEYS;

  // Ensure all known sections are in the order list
  const fullOrder = [...sectionOrder];
  for (const key of ALL_SECTION_KEYS) {
    if (!fullOrder.includes(key)) fullOrder.push(key);
  }

  const set = (value: string[]) =>
    dispatch({ type: "SET_FIELD", field: "section_order", value });

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const order = [...fullOrder];
    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    set(order);
  };

  const moveSectionDown = (index: number) => {
    if (index >= fullOrder.length - 1) return;
    const order = [...fullOrder];
    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    set(order);
  };

  return (
    <CollapsibleSection title="Section Order" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="space-y-2">
        {fullOrder.map((section, index) => (
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
              <button onClick={() => moveSectionDown(index)} disabled={index === fullOrder.length - 1}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
