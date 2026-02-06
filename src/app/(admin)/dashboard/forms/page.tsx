"use client";
import { FormsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function FormsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.FORMS_VIEW}>
      <FeatureGate feature="forms">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Forms
          </h1>
        </div>
        <FormsTable />
      </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
