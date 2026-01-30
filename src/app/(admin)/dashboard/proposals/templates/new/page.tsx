"use client";
import { ProposalTemplateEditor } from "@/components/agency/ProposalTemplateEditor";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function NewProposalTemplatePage() {
  return (
    <FeatureGate feature="proposals">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Create Template
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Build a reusable proposal template
          </p>
        </div>
        <ProposalTemplateEditor />
      </div>
    </FeatureGate>
  );
}
