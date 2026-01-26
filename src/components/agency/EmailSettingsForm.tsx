"use client";

import React, { useState, useEffect, useCallback } from "react";
import { emailProviders, getProviderDefinition } from "@/config/emailProviders";
import { EmailProvider, TenantEmailSettingsResponse } from "@/lib/email/types";

interface EmailSettingsFormProps {
  initialSettings?: TenantEmailSettingsResponse | null;
}

export default function EmailSettingsForm({ initialSettings }: EmailSettingsFormProps) {
  const [provider, setProvider] = useState<EmailProvider>(
    initialSettings?.provider || "system"
  );
  const [fromEmail, setFromEmail] = useState(initialSettings?.from_email || "");
  const [fromName, setFromName] = useState(initialSettings?.from_name || "");
  const [config, setConfig] = useState<Record<string, string>>(
    initialSettings?.config || {}
  );
  const [isVerified, setIsVerified] = useState(initialSettings?.is_verified || false);
  const [lastTestStatus, setLastTestStatus] = useState(
    initialSettings?.last_test_status || null
  );
  const [lastTestAt, setLastTestAt] = useState(initialSettings?.last_test_at || null);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const providerDef = getProviderDefinition(provider);

  // Reset config when provider changes
  useEffect(() => {
    if (provider !== initialSettings?.provider) {
      setConfig({});
      setIsVerified(false);
      setLastTestStatus(null);
    }
  }, [provider, initialSettings?.provider]);

  const handleConfigChange = useCallback((fieldName: string, value: string) => {
    setConfig((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          from_email: fromEmail || null,
          from_name: fromName || null,
          config,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setMessage({ type: "success", text: "Settings saved successfully" });
      setIsVerified(data.settings.is_verified);
      setLastTestStatus(data.settings.last_test_status);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Test email failed");
      }

      setMessage({ type: "success", text: data.message });
      setIsVerified(true);
      setLastTestStatus(`Success - ${data.message}`);
      setLastTestAt(new Date().toISOString());
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Test email failed",
      });
      setIsVerified(false);
      setLastTestStatus(`Failed - ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setTesting(false);
    }
  };

  const renderProviderFields = () => {
    if (!providerDef || providerDef.fields.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {providerDef.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === "select" ? (
              <select
                value={config[field.name] || ""}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={config[field.name] || ""}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as EmailProvider)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          {emailProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {providerDef && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {providerDef.description}
          </p>
        )}
      </div>

      {/* From Email & Name (not shown for system) */}
      {provider !== "system" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                From Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@yourdomain.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                From Name
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Company"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Provider-specific fields */}
          {renderProviderFields()}
        </>
      )}

      {/* Verification Status */}
      {provider !== "system" && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          {isVerified ? (
            <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Verified</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Not verified</span>
            </span>
          )}
          {lastTestAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              Last test: {new Date(lastTestAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {provider !== "system" && (
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testing || !fromEmail}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              "Send Test Email"
            )}
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
