"use client";

import CollapsibleSection from "./CollapsibleSection";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import type { SectionProps } from "./types";
import type { FaqItem } from "@/types/portal";

export default function FaqSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  const faqItems = state.faq_items || [];

  const addFaq = () => set("faq_items", [...faqItems, { question: "", answer: "" }]);
  const removeFaq = (index: number) => set("faq_items", faqItems.filter((_: FaqItem, i: number) => i !== index));
  const updateFaq = (index: number, field: keyof FaqItem, value: string) => {
    const updated = [...faqItems];
    updated[index] = { ...updated[index], [field]: value };
    set("faq_items", updated);
  };

  return (
    <CollapsibleSection title="FAQ" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable FAQ Section</label>
        <button type="button" onClick={() => set("show_faq", !state.show_faq)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_faq ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_faq ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {state.show_faq && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section Heading</label>
            <input type="text" value={state.faq_heading || ""} onChange={(e) => set("faq_heading", e.target.value)}
              placeholder="Frequently Asked Questions" className={inputClass} />
          </div>

          {faqItems.map((item: FaqItem, i: number) => (
            <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Question {i + 1}</span>
                <button onClick={() => removeFaq(i)} className="text-sm text-red-500 hover:text-red-600">Remove</button>
              </div>
              <input type="text" value={item.question} onChange={(e) => updateFaq(i, "question", e.target.value)}
                placeholder="What is your question?" className={inputClass} />
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Answer</label>
                <MarkdownEditor
                  value={item.answer}
                  onChange={(v) => updateFaq(i, "answer", v)}
                  placeholder="Write your answer here..."
                  rows={3}
                />
              </div>
            </div>
          ))}
          <button onClick={addFaq}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
        </>
      )}
    </CollapsibleSection>
  );
}
