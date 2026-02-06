"use client";
import { DomainSettings } from "@/components/agency";
import FeatureGate from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function DomainsSettingsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.SETTINGS_EDIT}>
      <FeatureGate feature="custom_branding">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Domain Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure your portal subdomain and custom domain</p>
        </div>

        <DomainSettings />
      </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
