"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

interface BillingData {
  plan_type: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  billing_interval: string;
}

export const SettingsPanel = () => {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [billing, setBilling] = useState<BillingData | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch("/api/settings/billing");
        if (res.ok) {
          const data = await res.json();
          setBilling(data.subscription);
        }
      } catch (err) {
        console.error("Failed to fetch billing:", err);
      }
    };
    fetchBilling();
  }, []);

  const getPlanDisplay = () => {
    if (!billing) return "Loading...";
    const planName = billing.plan_type.charAt(0).toUpperCase() + billing.plan_type.slice(1);
    const interval = billing.billing_interval === "yearly" ? "year" : "month";
    if (billing.discount_percent && billing.discount_percent > 0) {
      return `${planName} - $${billing.price}/${interval} (${billing.discount_percent}% off)`;
    }
    return `${planName} - $${billing.price}/${interval}`;
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          General Settings
        </h3>

        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                Dark Mode
              </p>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                Toggle between light and dark theme
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                theme === "dark" ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                Push Notifications
              </p>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                Receive notifications for important updates
              </p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Email Digest */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                Email Digest
              </p>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                Receive weekly summary of activity
              </p>
            </div>
            <button
              onClick={() => setEmailDigest(!emailDigest)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailDigest ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailDigest ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Billing */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Billing
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                Current Plan
              </p>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                {getPlanDisplay()}
              </p>
            </div>
            <Link href="/dashboard/settings/billing" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium">
              Manage
            </Link>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                Payment Methods
              </p>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                Manage payment methods
              </p>
            </div>
            <Link href="/dashboard/settings/billing" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium">
              Update
            </Link>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                Billing History
              </p>
              <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                View past invoices and receipts
              </p>
            </div>
            <Link href="/dashboard/settings/billing" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium">
              View
            </Link>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Integrations
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  Google Calendar
                </p>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Sync events with your calendar
                </p>
              </div>
            </div>
            <button className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600">
              Connect
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <span className="text-lg">💳</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  Stripe
                </p>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Process payments and invoices
                </p>
              </div>
            </div>
            <button className="rounded-lg border border-success-500 px-4 py-2 text-theme-sm font-medium text-success-500">
              Connected
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <span className="text-lg">📧</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  Mailchimp
                </p>
                <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Email marketing integration
                </p>
              </div>
            </div>
            <button className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
