"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";
import type { Testimonial } from "@/types/portal";

export default function TestimonialsSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  const testimonials = state.testimonials || [];

  const addTestimonial = () => set("testimonials", [...testimonials, { name: "", quote: "", role: "" }]);
  const removeTestimonial = (index: number) => set("testimonials", testimonials.filter((_: Testimonial, i: number) => i !== index));
  const updateTestimonial = (index: number, field: keyof Testimonial, value: string) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: value };
    set("testimonials", updated);
  };

  return (
    <CollapsibleSection title="Testimonials" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Testimonials</label>
        <button type="button" onClick={() => set("show_testimonials", !state.show_testimonials)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_testimonials ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_testimonials ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {state.show_testimonials && (
        <>
          {testimonials.map((t: Testimonial, i: number) => (
            <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Testimonial {i + 1}</span>
                <button onClick={() => removeTestimonial(i)} className="text-sm text-red-500 hover:text-red-600">Remove</button>
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
    </CollapsibleSection>
  );
}
