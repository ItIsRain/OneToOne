"use client";
import { PortalApprovalsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function PortalApprovalsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.SETTINGS_VIEW}>
      <FeatureGate feature="client_portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Approvals
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review and manage client approval requests
          </p>
        </div>
        <PortalApprovalsTable />
      </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
