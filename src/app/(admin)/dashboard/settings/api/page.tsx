"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { CreateApiKeyModal } from "@/components/agency/modals";

const apiKeys = [
  { id: 1, name: "Production API Key", key: "sk_live_...4f2d", created: "Jan 15, 2025", lastUsed: "2 hours ago", status: "Active" },
  { id: 2, name: "Development API Key", key: "sk_test_...8a3c", created: "Jan 10, 2025", lastUsed: "1 day ago", status: "Active" },
  { id: 3, name: "Webhook Secret", key: "whsec_...9b1e", created: "Jan 5, 2025", lastUsed: "3 days ago", status: "Active" },
];

export default function ApiKeysPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">API Keys</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage API keys for integrations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Create API Key
        </button>
      </div>

      <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-500/10">
        <p className="text-sm text-warning-700 dark:text-warning-400">
          <strong>Security Notice:</strong> Never share your API keys publicly. Rotate keys regularly and use environment variables.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white/90">Your API Keys</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-gray-800 dark:text-white/90">{apiKey.name}</h4>
                    <Badge size="sm" color="success">{apiKey.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">Created {apiKey.created}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">Rotate</button>
                  <button className="text-error-500 hover:text-error-600 text-sm font-medium">Revoke</button>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <code className="flex-1 text-sm text-gray-600 dark:text-gray-400 font-mono">{apiKey.key}</code>
                <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">Copy</button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Last used: {apiKey.lastUsed}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">API Documentation</h3>
        <p className="text-sm text-gray-500 mb-4">Learn how to integrate with our API to automate workflows and build custom integrations.</p>
        <button className="rounded-lg border border-brand-500 px-4 py-2.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10">
          View Documentation
        </button>
      </div>

      <CreateApiKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
