"use client";
import { ContractTemplateEditor } from "@/components/agency/ContractTemplateEditor";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function NewContractTemplatePage() {
  return (
    <FeatureGate feature="contracts">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Create Contract Template
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Build a reusable contract template with sections
          </p>
        </div>
        <ContractTemplateEditor />
      </div>
    </FeatureGate>
  );
}
