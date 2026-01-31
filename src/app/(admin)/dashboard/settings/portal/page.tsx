import type { Metadata } from "next";
import PortalSettingsClient from "./PortalSettingsClient";
import FeatureGate from "@/components/ui/FeatureGate";

export const metadata: Metadata = {
  title: "Portal Settings",
  description: "Customize your public portal landing page",
};

export default function PortalSettingsPage() {
  return (
    <FeatureGate feature="client_portal">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Portal Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Customize the public portal landing page for your organization. Changes are visible at your subdomain.
          </p>
        </div>
        <PortalSettingsClient />
      </div>
    </FeatureGate>
  );
}
