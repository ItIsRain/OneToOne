"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";
import type { PartnerItem } from "@/types/portal";

export default function PartnersSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  const partners = state.partners || [];

  const addPartner = () => set("partners", [...partners, { name: "", logo_url: "", url: "" }]);
  const removePartner = (index: number) => set("partners", partners.filter((_: PartnerItem, i: number) => i !== index));
  const updatePartner = (index: number, field: keyof PartnerItem, value: string) => {
    const updated = [...partners];
    updated[index] = { ...updated[index], [field]: value };
    set("partners", updated);
  };

  return (
    <CollapsibleSection title="Partners" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Partners Section</label>
        <button type="button" onClick={() => set("show_partners", !state.show_partners)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_partners ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_partners ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {state.show_partners && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section Heading</label>
            <input type="text" value={state.partners_heading || ""} onChange={(e) => set("partners_heading", e.target.value)}
              placeholder="Our Partners" className={inputClass} />
          </div>

          {partners.map((p: PartnerItem, i: number) => (
            <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Partner {i + 1}</span>
                <button onClick={() => removePartner(i)} className="text-sm text-red-500 hover:text-red-600">Remove</button>
              </div>
              <input type="text" value={p.name} onChange={(e) => updatePartner(i, "name", e.target.value)}
                placeholder="Partner name" className={inputClass} />
              <input type="text" value={p.logo_url} onChange={(e) => updatePartner(i, "logo_url", e.target.value)}
                placeholder="Logo URL (https://...)" className={inputClass} />
              <input type="text" value={p.url} onChange={(e) => updatePartner(i, "url", e.target.value)}
                placeholder="Website URL (https://...)" className={inputClass} />
            </div>
          ))}
          <button onClick={addPartner}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Partner
          </button>
        </>
      )}
    </CollapsibleSection>
  );
}
