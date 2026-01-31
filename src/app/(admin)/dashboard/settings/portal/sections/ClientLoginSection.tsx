"use client";

import CollapsibleSection from "./CollapsibleSection";
import type { SectionProps } from "./types";

export default function ClientLoginSection({ state, dispatch, expanded, onToggle, inputClass }: SectionProps) {
  const set = (field: string, value: unknown) =>
    dispatch({ type: "SET_FIELD", field: field as keyof typeof state, value });

  const loginMethods = state.login_methods || ["password", "magic_link"];

  const toggleMethod = (method: "password" | "magic_link") => {
    const current = [...loginMethods];
    const idx = current.indexOf(method);
    if (idx >= 0) {
      // Don't allow removing the last method
      if (current.length <= 1) return;
      current.splice(idx, 1);
    } else {
      current.push(method);
    }
    set("login_methods", current);
  };

  return (
    <CollapsibleSection title="Client Login" expanded={expanded} onToggle={onToggle}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Allowed Login Methods
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={loginMethods.includes("password")}
              onChange={() => toggleMethod("password")}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
            />
            <div>
              <span className="text-sm font-medium text-gray-800 dark:text-white">Email &amp; Password</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clients sign in with their email and a password you set.</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={loginMethods.includes("magic_link")}
              onChange={() => toggleMethod("magic_link")}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
            />
            <div>
              <span className="text-sm font-medium text-gray-800 dark:text-white">Magic Link</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clients receive a one-time sign-in link via email. No password needed.</p>
            </div>
          </label>
        </div>
        {loginMethods.length === 1 && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            At least one login method must be enabled.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Welcome Message
        </label>
        <input
          type="text"
          value={state.login_welcome_message || ""}
          onChange={(e) => set("login_welcome_message", e.target.value)}
          placeholder="e.g. Sign in to access your projects and invoices"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Shown on the login page below your organization name. Leave empty for no message.
        </p>
      </div>
    </CollapsibleSection>
  );
}
