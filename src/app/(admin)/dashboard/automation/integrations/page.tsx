"use client";
import { IntegrationsSettings } from "@/components/agency/IntegrationsSettings";
import FeatureGate from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function IntegrationsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.INTEGRATIONS_MANAGE}>
      <FeatureGate feature="workflows">
        <IntegrationsSettings />
      </FeatureGate>
    </ProtectedPage>
  );
}
