import type { Metadata } from "next";
import EmailSettingsClient from "./EmailSettingsClient";
import { FeatureGate } from "@/components/ui/FeatureGate";

export const metadata: Metadata = {
  title: "Email Provider | Settings",
  description: "Configure your custom email provider",
};

export default function EmailSettingsPage() {
  return (
    <FeatureGate feature="email_provider">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Email Provider
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Configure a custom email provider to send emails from your domain
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <EmailSettingsClient />
        </div>
      </div>
    </FeatureGate>
  );
}
