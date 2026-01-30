"use client";
import { use } from "react";
import { ContractBuilder } from "@/components/agency/ContractBuilder";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function ContractEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <FeatureGate feature="contracts">
      <ContractBuilder contractId={id} />
    </FeatureGate>
  );
}
