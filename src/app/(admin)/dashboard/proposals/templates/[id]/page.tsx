"use client";
import { use } from "react";
import { ProposalTemplateEditor } from "@/components/agency/ProposalTemplateEditor";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function EditProposalTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <FeatureGate feature="proposals">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Edit Template
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Modify your proposal template
          </p>
        </div>
        <ProposalTemplateEditor templateId={id} />
      </div>
    </FeatureGate>
  );
}
