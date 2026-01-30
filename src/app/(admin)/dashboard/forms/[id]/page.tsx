"use client";
import { use } from "react";
import { FormBuilder } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function FormEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <FeatureGate feature="forms">
      <FormBuilder formId={id} />
    </FeatureGate>
  );
}
