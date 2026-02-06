"use client";
import { ReportsGenerator } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function ReportsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.REPORTS_VIEW}>
      <FeatureGate feature="advanced_analytics">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Analytics & Reports</h1>
            <p className="text-gray-500 dark:text-gray-400">Generate and download business reports</p>
          </div>
          <ReportsGenerator />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
