import { Metadata } from "next";
import { WorkflowEditor } from "@/components/agency/WorkflowEditor";

export const metadata: Metadata = {
  title: "Workflow Editor | Automation",
};

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowEditor workflowId={id} />;
}
