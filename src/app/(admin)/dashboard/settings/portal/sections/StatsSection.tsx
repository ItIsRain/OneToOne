"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";
import type { StatItem } from "@/types/portal";

export default function StatsSection({ state, dispatch, expanded, onToggle, inputClass, icon, description, statusBadge }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  const stats = state.stats || [];

  const addStat = () => set("stats", [...stats, { value: "", label: "", suffix: "" }]);
  const removeStat = (index: number) => set("stats", stats.filter((_: StatItem, i: number) => i !== index));
  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    set("stats", updated);
  };

  return (
    <CollapsibleSection title="Stats" expanded={expanded} onToggle={onToggle} icon={icon} description={description} statusBadge={statusBadge}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Stats Section</label>
        <button type="button" onClick={() => set("show_stats", !state.show_stats)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${state.show_stats ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${state.show_stats ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {state.show_stats && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section Heading</label>
            <input type="text" value={state.stats_heading || ""} onChange={(e) => set("stats_heading", e.target.value)}
              placeholder="Our Impact" className={inputClass} />
          </div>

          {stats.map((s: StatItem, i: number) => (
            <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Stat {i + 1}</span>
                <button onClick={() => removeStat(i)} className="text-sm text-red-500 hover:text-red-600">Remove</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Value</label>
                  <input type="text" value={s.value} onChange={(e) => updateStat(i, "value", e.target.value)}
                    placeholder="100" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Suffix</label>
                  <input type="text" value={s.suffix} onChange={(e) => updateStat(i, "suffix", e.target.value)}
                    placeholder="+" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Label</label>
                  <input type="text" value={s.label} onChange={(e) => updateStat(i, "label", e.target.value)}
                    placeholder="Happy Clients" className={inputClass} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addStat}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Stat
          </button>
        </>
      )}
    </CollapsibleSection>
  );
}
