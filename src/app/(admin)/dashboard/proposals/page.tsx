"use client";
import { ProposalsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function ProposalsPage() {
  return (
    <FeatureGate feature="proposals">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Proposals
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create and manage client proposals
          </p>
        </div>
        <ProposalsTable />
      </div>
    </FeatureGate>
  );
}
