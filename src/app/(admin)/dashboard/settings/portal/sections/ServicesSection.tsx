"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";
import type { ServiceItem } from "@/types/portal";

const ICON_OPTIONS = [
  "rocket", "shield", "chart", "users", "star", "globe",
  "zap", "heart", "target", "layers", "award", "cpu",
];

export default function ServicesSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  const services = state.services || [];

  const addService = () => set("services", [...services, { icon: "star", title: "", description: "" }]);
  const removeService = (index: number) => set("services", services.filter((_: ServiceItem, i: number) => i !== index));
  const updateService = (index: number, field: keyof ServiceItem, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    set("services", updated);
  };

  return (
    <CollapsibleSection title="Services" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Services Section</label>
        <button type="button" onClick={() => set("show_services", !state.show_services)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_services ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_services ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {state.show_services && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section Heading</label>
            <input type="text" value={state.services_heading || ""} onChange={(e) => set("services_heading", e.target.value)}
              placeholder="Our Services" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section Subheading</label>
            <input type="text" value={state.services_subheading || ""} onChange={(e) => set("services_subheading", e.target.value)}
              placeholder="What we offer" className={inputClass} />
          </div>

          {services.map((s: ServiceItem, i: number) => (
            <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Service {i + 1}</span>
                <button onClick={() => removeService(i)} className="text-sm text-red-500 hover:text-red-600">Remove</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Icon</label>
                <select value={s.icon} onChange={(e) => updateService(i, "icon", e.target.value)} className={inputClass}>
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <input type="text" value={s.title} onChange={(e) => updateService(i, "title", e.target.value)}
                placeholder="Service title" className={inputClass} />
              <textarea value={s.description} onChange={(e) => updateService(i, "description", e.target.value)}
                placeholder="Service description" rows={2} className={inputClass} />
            </div>
          ))}
          <button onClick={addService}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Service
          </button>
        </>
      )}
    </CollapsibleSection>
  );
}
