import { Metadata } from "next";
import { WorkflowsTable } from "@/components/agency";

export const metadata: Metadata = {
  title: "Workflows | Automation",
};

export default function WorkflowsPage() {
  return <WorkflowsTable />;
}
