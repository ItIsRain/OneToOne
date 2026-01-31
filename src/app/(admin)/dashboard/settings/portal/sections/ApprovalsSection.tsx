"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";

export default function ApprovalsSection({ state, dispatch, expanded, onToggle, inputClass }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  return (
    <CollapsibleSection title="Approvals" expanded={expanded} onToggle={onToggle}>
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={state.require_approval_comment || false}
            onChange={(e) => set("require_approval_comment", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-white">Require comment on rejection</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Clients must provide a comment when rejecting or requesting revisions on an approval item.
            </p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Notification Email
        </label>
        <input
          type="email"
          value={state.approval_notification_email || ""}
          onChange={(e) => set("approval_notification_email", e.target.value)}
          placeholder="e.g. approvals@yourcompany.com"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Send approval responses to this email address. Leave empty to use the default team notification settings.
        </p>
      </div>
    </CollapsibleSection>
  );
}
