"use client";
import { CompanySettings } from "@/components/agency";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function SettingsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.SETTINGS_VIEW}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Company Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your company profile and preferences</p>
        </div>

        <CompanySettings />
      </div>
    </ProtectedPage>
  );
}
