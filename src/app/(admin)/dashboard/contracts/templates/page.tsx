"use client";
import { ContractTemplatesTable } from "@/components/agency/ContractTemplatesTable";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function ContractTemplatesPage() {
  return (
    <FeatureGate feature="contracts">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Contract Templates
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage reusable contract templates
          </p>
        </div>
        <ContractTemplatesTable />
      </div>
    </FeatureGate>
  );
}
