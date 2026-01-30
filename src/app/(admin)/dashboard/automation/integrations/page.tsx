import { Metadata } from "next";
import { IntegrationsSettings } from "@/components/agency/IntegrationsSettings";
import FeatureGate from "@/components/ui/FeatureGate";

export const metadata: Metadata = {
  title: "Integrations | Automation",
};

export default function IntegrationsPage() {
  return (
    <FeatureGate feature="workflows">
      <IntegrationsSettings />
    </FeatureGate>
  );
}
