"use client";
import { use } from "react";
import { ContractTemplateEditor } from "@/components/agency/ContractTemplateEditor";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function EditContractTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <FeatureGate feature="contracts">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Edit Contract Template
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Modify your contract template
          </p>
        </div>
        <ContractTemplateEditor templateId={id} />
      </div>
    </FeatureGate>
  );
}
