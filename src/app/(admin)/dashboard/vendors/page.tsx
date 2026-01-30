"use client";
import { VendorsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function VendorsPage() {
  return (
    <FeatureGate feature="vendors">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Vendors
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your vendor relationships and services
          </p>
        </div>
        <VendorsTable />
      </div>
    </FeatureGate>
  );
}
