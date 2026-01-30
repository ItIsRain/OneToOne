"use client";
import { use } from "react";
import { FormTemplateEditor } from "@/components/agency/FormTemplateEditor";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function EditFormTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <FeatureGate feature="forms">
      <div className="space-y-6">
        <FormTemplateEditor templateId={id} />
      </div>
    </FeatureGate>
  );
}
