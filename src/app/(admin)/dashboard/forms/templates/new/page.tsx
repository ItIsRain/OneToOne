"use client";
import { FormTemplateEditor } from "@/components/agency/FormTemplateEditor";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function NewFormTemplatePage() {
  return (
    <FeatureGate feature="forms">
      <div className="space-y-6">
        <FormTemplateEditor />
      </div>
    </FeatureGate>
  );
}
