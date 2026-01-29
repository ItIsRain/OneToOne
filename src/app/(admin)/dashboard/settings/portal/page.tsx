import type { Metadata } from "next";
import PortalSettingsClient from "./PortalSettingsClient";

export const metadata: Metadata = {
  title: "Portal Settings",
  description: "Customize your public portal landing page",
};

export default function PortalSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Portal Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize the public portal landing page for your organization. Changes are visible at your subdomain.
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <PortalSettingsClient />
      </div>
    </div>
  );
}
