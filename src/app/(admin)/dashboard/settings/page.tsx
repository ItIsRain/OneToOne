import type { Metadata } from "next";
import { SettingsPanel } from "@/components/agency";

export const metadata: Metadata = {
  title: "Settings | Company",
  description: "Manage company settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Company Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account, billing, and integrations</p>
      </div>
      <SettingsPanel />
    </div>
  );
}
