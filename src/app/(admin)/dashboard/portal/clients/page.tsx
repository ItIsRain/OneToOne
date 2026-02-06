"use client";
import { PortalClientsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function PortalClientsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.CLIENTS_VIEW}>
      <FeatureGate feature="client_portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Portal Clients
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage client portal access and settings
          </p>
        </div>
        <PortalClientsTable />
      </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
