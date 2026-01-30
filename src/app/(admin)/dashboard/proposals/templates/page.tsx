"use client";
import { ProposalTemplatesTable } from "@/components/agency/ProposalTemplatesTable";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function ProposalTemplatesPage() {
  return (
    <FeatureGate feature="proposals">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Proposal Templates
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage reusable proposal templates
          </p>
        </div>
        <ProposalTemplatesTable />
      </div>
    </FeatureGate>
  );
}
