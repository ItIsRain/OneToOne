import { Metadata } from "next";
import { WorkflowEditor } from "@/components/agency/WorkflowEditor";
import FeatureGate from "@/components/ui/FeatureGate";

export const metadata: Metadata = {
  title: "Workflow Editor | Automation",
};

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FeatureGate feature="workflows">
      <WorkflowEditor workflowId={id} />
    </FeatureGate>
  );
}
