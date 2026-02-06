"use client";
import { WorkflowsTable } from "@/components/agency";
import FeatureGate from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function WorkflowsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.AUTOMATION_VIEW}>
      <FeatureGate feature="workflows">
        <WorkflowsTable />
      </FeatureGate>
    </ProtectedPage>
  );
}
