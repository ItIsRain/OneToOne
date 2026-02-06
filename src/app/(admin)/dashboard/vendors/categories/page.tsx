"use client";
import { VendorCategoriesTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function VendorCategoriesPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.VENDORS_MANAGE}>
      <FeatureGate feature="vendors">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Vendor Categories
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Organize vendors by category
            </p>
          </div>
          <VendorCategoriesTable />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
