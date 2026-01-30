"use client";
import { use } from "react";
import { ProposalBuilder } from "@/components/agency/ProposalBuilder";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function ProposalEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <FeatureGate feature="proposals">
      <ProposalBuilder proposalId={id} />
    </FeatureGate>
  );
}
