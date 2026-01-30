"use client";
import { FormsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function FormsPage() {
  return (
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
  );
}
