import { DomainSettings } from "@/components/agency";

export default function DomainsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Domain Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure your portal subdomain and custom domain</p>
      </div>

      <DomainSettings />
    </div>
  );
}
