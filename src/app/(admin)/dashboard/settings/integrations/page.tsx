"use client";
import React from "react";

const integrations = [
  { id: 1, name: "Google Calendar", description: "Sync events and meetings", status: "connected", icon: "📅" },
  { id: 2, name: "Stripe", description: "Payment processing", status: "connected", icon: "💳" },
  { id: 3, name: "Slack", description: "Team communication", status: "disconnected", icon: "💬" },
  { id: 4, name: "Mailchimp", description: "Email marketing", status: "disconnected", icon: "📧" },
  { id: 5, name: "Zapier", description: "Workflow automation", status: "connected", icon: "⚡" },
  { id: 6, name: "QuickBooks", description: "Accounting software", status: "disconnected", icon: "📊" },
  { id: 7, name: "HubSpot", description: "CRM integration", status: "disconnected", icon: "🎯" },
  { id: 8, name: "Zoom", description: "Video conferencing", status: "connected", icon: "📹" },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Integrations</h1>
        <p className="text-gray-500 dark:text-gray-400">Connect third-party services to enhance functionality</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <div key={integration.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl dark:bg-gray-800">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{integration.name}</h3>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                </div>
              </div>
              {integration.status === "connected" ? (
                <button className="rounded-lg border border-error-500 px-4 py-2 text-sm font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10">
                  Disconnect
                </button>
              ) : (
                <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                  Connect
                </button>
              )}
            </div>
            {integration.status === "connected" && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="inline-flex items-center gap-2 text-sm text-success-500">
                  <span className="w-2 h-2 rounded-full bg-success-500" />
                  Connected
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
