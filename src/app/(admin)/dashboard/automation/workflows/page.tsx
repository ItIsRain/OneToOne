import { Metadata } from "next";
import { WorkflowsTable } from "@/components/agency";
import FeatureGate from "@/components/ui/FeatureGate";

export const metadata: Metadata = {
  title: "Workflows | Automation",
};

export default function WorkflowsPage() {
  return (
    <FeatureGate feature="workflows">
      <WorkflowsTable />
    </FeatureGate>
  );
}
