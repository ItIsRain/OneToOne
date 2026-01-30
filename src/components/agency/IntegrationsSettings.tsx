"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  integrationProviders,
  categoryLabels,
  type IntegrationProviderDefinition,
  type IntegrationCategory,
} from "@/config/integrationProviders";

const providerLogos: Record<string, React.ReactNode> = {
  twilio: (
    <svg viewBox="0 0 256 256" className="h-6 w-6" fill="none">
      <rect width="256" height="256" rx="128" fill="#F22F46" />
      <circle cx="128" cy="128" r="56" fill="none" stroke="#fff" strokeWidth="12" />
      <circle cx="108" cy="108" r="14" fill="#fff" />
      <circle cx="148" cy="108" r="14" fill="#fff" />
      <circle cx="108" cy="148" r="14" fill="#fff" />
      <circle cx="148" cy="148" r="14" fill="#fff" />
    </svg>
  ),
  slack: (
    <svg viewBox="0 0 256 256" className="h-6 w-6" fill="none">
      {/* Slack logo - 4 colored sections */}
      <path d="M97 17a20 20 0 0 0-20 20v53h53a20 20 0 0 0 0-40H97V17z" fill="#E01E5A" />
      <path d="M17 117a20 20 0 0 0 20 20h53V84H37a20 20 0 0 0-20 20z" fill="#36C5F0" />
      <path d="M117 239a20 20 0 0 0 20-20v-53h-53a20 20 0 0 0 0 40h13v33z" fill="#2EB67D" />
      <path d="M239 137a20 20 0 0 0-20-20h-53v53h53a20 20 0 0 0 20-20z" fill="#ECB22E" />
      <rect x="77" y="84" width="53" height="86" fill="#E01E5A" />
      <rect x="84" y="77" width="86" height="53" fill="#36C5F0" />
      <rect x="126" y="84" width="53" height="86" fill="#2EB67D" />
      <rect x="84" y="126" width="86" height="53" fill="#ECB22E" />
    </svg>
  ),
  elevenlabs: (
    <svg viewBox="0 0 256 256" className="h-6 w-6" fill="none">
      <rect width="256" height="256" rx="32" fill="#000" />
      <rect x="88" y="56" width="24" height="144" rx="4" fill="#fff" />
      <rect x="144" y="56" width="24" height="144" rx="4" fill="#fff" />
    </svg>
  ),
  openai: (
    <svg viewBox="0 0 256 256" className="h-6 w-6">
      <rect width="256" height="256" rx="32" fill="#000" />
      <path
        d="M197.2 107.1a52.5 52.5 0 0 0-4.5-43.1 53.2 53.2 0 0 0-57.3-25.5 52.5 52.5 0 0 0-39.5-17.5 53.2 53.2 0 0 0-50.8 37 52.5 52.5 0 0 0-35.1 25.5 53.2 53.2 0 0 0 6.5 62.3 52.5 52.5 0 0 0 4.5 43.1 53.2 53.2 0 0 0 57.3 25.5 52.5 52.5 0 0 0 39.5 17.5 53.2 53.2 0 0 0 50.8-37 52.5 52.5 0 0 0 35.1-25.5 53.2 53.2 0 0 0-6.5-62.3z"
        fill="none"
        stroke="#fff"
        strokeWidth="12"
        transform="translate(26 26) scale(0.8)"
      />
    </svg>
  ),
  stripe: (
    <svg viewBox="0 0 256 256" className="h-6 w-6" fill="none">
      <rect width="256" height="256" rx="32" fill="#635BFF" />
      <path
        d="M121.7 100.2c0-7.1 5.8-9.8 15.4-9.8 13.8 0 31.2 4.2 45 11.6V62.4c-15.1-6-30-8.4-45-8.4-36.8 0-61.2 19.2-61.2 51.3 0 50 68.8 42 68.8 63.6 0 8.4-7.3 11.1-17.5 11.1-15.1 0-34.5-6.2-49.8-14.6v40.6c17 7.3 34.1 10.4 49.8 10.4 37.7 0 63.6-18.6 63.6-51.2-.1-54-69.1-44.3-69.1-65z"
        fill="#fff"
      />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 256 256" className="h-6 w-6" fill="none">
      <rect width="256" height="256" rx="32" fill="#25D366" />
      <path
        d="M128 36C76.4 36 34.7 77.3 34.7 128.5c0 16.7 4.5 33 12.9 47.3L34 222l47.5-12.4c13.8 7.5 29.4 11.5 45.5 11.5h0c51.6 0 93.3-41.3 93.3-92.5S179.6 36 128 36z"
        fill="#fff"
      />
      <path
        d="M128 48.5c-44.7 0-81 35.9-81 80 0 15.1 4.2 29.8 12.3 42.5l-8 29.2 30.2-7.9c12.3 6.7 26.2 10.2 40.5 10.2h0c44.7 0 81-35.9 81-80s-36.3-80-81-80zm0 146.5c-12.6 0-24.9-3.4-35.6-9.8l-2.6-1.5-26.5 6.9 7.1-25.9-1.7-2.7c-7-11.2-10.7-24.1-10.7-37.5 0-38.6 31.6-70 70.5-70s70.5 31.4 70.5 70-31.6 70-70.5 70z"
        fill="#25D366"
      />
      <path
        d="M175.3 147.2c-2.6-1.3-15.2-7.5-17.6-8.3-2.4-.8-4.1-1.3-5.8 1.3-1.7 2.6-6.7 8.3-8.2 10.1-1.5 1.7-3 1.9-5.6.6-2.6-1.3-10.9-4-20.8-12.8-7.7-6.8-12.9-15.3-14.4-17.8-1.5-2.6-.2-4 1.1-5.3 1.2-1.2 2.6-3 3.9-4.5 1.3-1.5 1.7-2.6 2.6-4.3.9-1.7.4-3.2-.2-4.5-.6-1.3-5.8-13.9-7.9-19-2.1-5-4.2-4.3-5.8-4.4h-4.9c-1.7 0-4.5.6-6.8 3.2-2.4 2.6-9 8.8-9 21.4s9.2 24.8 10.5 26.5c1.3 1.7 18.1 27.6 43.9 38.7 6.1 2.6 10.9 4.2 14.7 5.4 6.2 2 11.8 1.7 16.2 1 5-0.8 15.2-6.2 17.4-12.2 2.1-6 2.1-11.1 1.5-12.2-.6-1.1-2.4-1.7-5-3z"
        fill="#fff"
      />
    </svg>
  ),
  google_calendar: (
    <svg viewBox="0 0 256 256" className="h-6 w-6" fill="none">
      <rect width="256" height="256" rx="32" fill="#fff" />
      <path d="M176 32H80L32 80v96l48 48h96l48-48V80l-48-48z" fill="#4285F4" />
      <rect x="64" y="64" width="128" height="128" rx="8" fill="#fff" />
      <rect x="64" y="64" width="128" height="36" rx="8" fill="#4285F4" />
      <circle cx="100" cy="84" r="4" fill="#fff" />
      <circle cx="156" cy="84" r="4" fill="#fff" />
      <rect x="88" y="116" width="24" height="8" rx="2" fill="#4285F4" />
      <rect x="88" y="136" width="24" height="8" rx="2" fill="#4285F4" />
      <rect x="88" y="156" width="24" height="8" rx="2" fill="#4285F4" />
      <rect x="120" y="116" width="24" height="8" rx="2" fill="#EA4335" />
      <rect x="120" y="136" width="24" height="8" rx="2" fill="#EA4335" />
      <rect x="120" y="156" width="24" height="8" rx="2" fill="#EA4335" />
      <rect x="152" y="116" width="24" height="8" rx="2" fill="#34A853" />
      <rect x="152" y="136" width="24" height="8" rx="2" fill="#34A853" />
    </svg>
  ),
  zapier: (
    <svg viewBox="0 0 256 256" className="h-6 w-6" fill="none">
      <rect width="256" height="256" rx="32" fill="#FF4F00" />
      <path
        d="M184 110h-42.4l30-30-14.1-14.1-30 30V54h-20v41.9l-30-30L63.4 80l30 30H52v20h41.9l-30 30 14.1 14.1 30-30V186h20v-41.9l30 30 14.1-14.1-30-30H184v-20z"
        fill="#fff"
      />
      <circle cx="128" cy="128" r="24" fill="#FF4F00" stroke="#fff" strokeWidth="8" />
    </svg>
  ),
};

interface SavedIntegration {
  id: string;
  provider: string;
  config: Record<string, string>;
  is_active: boolean;
  last_test_at: string | null;
  last_test_status: string | null;
}

export function IntegrationsSettings() {
  const [savedIntegrations, setSavedIntegrations] = useState<SavedIntegration[]>([]);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/integrations");
      if (res.ok) {
        const data = await res.json();
        setSavedIntegrations(data.integrations || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const getSavedIntegration = (providerId: string): SavedIntegration | undefined => {
    return savedIntegrations.find((i) => i.provider === providerId);
  };

  const handleExpand = (providerId: string) => {
    if (expandedProvider === providerId) {
      setExpandedProvider(null);
      setFormValues({});
      return;
    }
    setExpandedProvider(providerId);
    setMessage(null);

    // Pre-fill form with saved values
    const saved = getSavedIntegration(providerId);
    if (saved?.config) {
      setFormValues({ ...saved.config });
    } else {
      setFormValues({});
    }
  };

  const handleSave = async (provider: IntegrationProviderDefinition) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.id,
          config: formValues,
          is_active: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: "success", text: `${provider.name} settings saved.` });
        await fetchIntegrations();
        // Update form with masked values from response
        if (data.integration?.config) {
          setFormValues({ ...data.integration.config });
        }
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (provider: IntegrationProviderDefinition) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.id,
          config: {},
          is_active: false,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `${provider.name} disconnected.` });
        await fetchIntegrations();
        setFormValues({});
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  // Group providers by category
  const grouped = integrationProviders.reduce<Record<IntegrationCategory, IntegrationProviderDefinition[]>>(
    (acc, provider) => {
      if (!acc[provider.category]) acc[provider.category] = [];
      acc[provider.category].push(provider);
      return acc;
    },
    {} as Record<IntegrationCategory, IntegrationProviderDefinition[]>
  );

  const categoryOrder: IntegrationCategory[] = ['messaging', 'ai', 'payments', 'calendar', 'automation'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Integrations</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Connect third-party services to power your automation workflows.
        </p>
      </div>

      {/* Categories */}
      {categoryOrder.map((category) => {
        const providers = grouped[category];
        if (!providers || providers.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {categoryLabels[category]}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => {
                const saved = getSavedIntegration(provider.id);
                const isConnected = saved?.is_active === true && Object.keys(saved.config || {}).length > 0;
                const isExpanded = expandedProvider === provider.id;

                return (
                  <div
                    key={provider.id}
                    className={`rounded-xl border transition-all ${
                      isExpanded
                        ? "col-span-full border-brand-300 dark:border-brand-600 shadow-sm"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    } bg-white dark:bg-gray-800`}
                  >
                    {/* Card header */}
                    <button
                      type="button"
                      onClick={() => handleExpand(provider.id)}
                      className="flex w-full items-center gap-4 p-4 text-left"
                    >
                      {/* Provider logo */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                        {providerLogos[provider.id] || (
                          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                            {provider.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {provider.name}
                          </span>
                          {isConnected && (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Connected
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {provider.description}
                        </p>
                      </div>
                      <svg
                        className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded form */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                        {/* Message */}
                        {message && (
                          <div
                            className={`rounded-lg px-4 py-3 text-sm ${
                              message.type === "success"
                                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {message.text}
                          </div>
                        )}

                        {/* Fields */}
                        {provider.fields.map((field) => (
                          <div key={field.name}>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-0.5">*</span>}
                            </label>
                            {field.type === "select" ? (
                              <select
                                value={formValues[field.name] || ""}
                                onChange={(e) =>
                                  setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              >
                                <option value="">Select...</option>
                                {field.options?.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={field.type === "password" ? "password" : "text"}
                                value={formValues[field.name] || ""}
                                onChange={(e) =>
                                  setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                                }
                                placeholder={field.placeholder}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                              />
                            )}
                          </div>
                        ))}

                        {/* Docs link */}
                        {provider.docsUrl && (
                          <p className="text-xs text-gray-400">
                            <a
                              href={provider.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-brand-500 underline"
                            >
                              View documentation
                            </a>
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleSave(provider)}
                            disabled={saving}
                            className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                          >
                            {saving ? "Saving..." : isConnected ? "Update" : "Connect"}
                          </button>
                          {isConnected && (
                            <button
                              type="button"
                              onClick={() => handleDisconnect(provider)}
                              disabled={saving}
                              className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              Disconnect
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleExpand(provider.id)}
                            className="ml-auto text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
