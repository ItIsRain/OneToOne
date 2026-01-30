"use client";
import React, { useState } from "react";
import type { Form } from "./FormsTable";

interface FormSettingsPanelProps {
  form: Form;
  onChange: (updates: Partial<Form>) => void;
  onClose: () => void;
}

type SettingsTab = "general" | "thank_you" | "crm" | "notifications";

export const FormSettingsPanel: React.FC<FormSettingsPanelProps> = ({
  form,
  onChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "thank_you", label: "Thank You" },
    { id: "crm", label: "CRM Integration" },
    { id: "notifications", label: "Notifications" },
  ];

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 z-99999 flex justify-end">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Form Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 px-6">
          <nav className="flex gap-4 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* General Tab */}
          {activeTab === "general" && (
            <>
              <div>
                <label className={labelClass}>Form Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    onChange({ description: e.target.value || null })
                  }
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    /form/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      onChange({
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-"),
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    onChange({
                      status: e.target.value as Form["status"],
                    })
                  }
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </>
          )}

          {/* Thank You Tab */}
          {activeTab === "thank_you" && (
            <>
              <div>
                <label className={labelClass}>Thank You Title</label>
                <input
                  type="text"
                  value={form.thank_you_title || ""}
                  onChange={(e) =>
                    onChange({ thank_you_title: e.target.value || null })
                  }
                  placeholder="Thank you for your submission!"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Thank You Message</label>
                <textarea
                  value={form.thank_you_message || ""}
                  onChange={(e) =>
                    onChange({ thank_you_message: e.target.value || null })
                  }
                  rows={4}
                  placeholder="We've received your submission and will be in touch soon."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Redirect URL (optional)</label>
                <input
                  type="url"
                  value={form.thank_you_redirect_url || ""}
                  onChange={(e) =>
                    onChange({
                      thank_you_redirect_url: e.target.value || null,
                    })
                  }
                  placeholder="https://example.com/thank-you"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  If set, users will be redirected to this URL after submitting.
                </p>
              </div>
            </>
          )}

          {/* CRM Integration Tab */}
          {activeTab === "crm" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-create Lead
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically create a lead from each submission.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ auto_create_lead: !form.auto_create_lead })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    form.auto_create_lead
                      ? "bg-brand-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      form.auto_create_lead
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-create Contact
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically create a contact from each submission.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      auto_create_contact: !form.auto_create_contact,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    form.auto_create_contact
                      ? "bg-brand-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      form.auto_create_contact
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {(form.auto_create_lead || form.auto_create_contact) && (
                <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Field Mapping
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Map form fields to CRM fields. Select which form field
                    should populate each CRM field.
                  </p>

                  {["name", "email", "phone", "company"].map((crmField) => (
                    <div key={crmField} className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">
                        {crmField}
                      </label>
                      <select
                        value={form.lead_field_mapping?.[crmField] || ""}
                        onChange={(e) => {
                          const mapping = {
                            ...(form.lead_field_mapping || {}),
                            [crmField]: e.target.value,
                          };
                          onChange({ lead_field_mapping: mapping });
                        }}
                        className={inputClass}
                      >
                        <option value="">-- Not Mapped --</option>
                        {form.fields
                          .filter(
                            (f) =>
                              !["section_heading", "paragraph"].includes(f.type)
                          )
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Notifications
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Email notification settings coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
