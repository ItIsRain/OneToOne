"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  integrationProviders,
  categoryLabels,
  type IntegrationProviderDefinition,
  type IntegrationCategory,
} from "@/config/integrationProviders";

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
                      {/* Icon placeholder */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300">
                        {provider.name.charAt(0)}
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
