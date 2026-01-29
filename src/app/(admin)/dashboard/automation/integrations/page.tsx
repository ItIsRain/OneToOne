import { Metadata } from "next";
import { IntegrationsSettings } from "@/components/agency/IntegrationsSettings";

export const metadata: Metadata = {
  title: "Integrations | Automation",
};

export default function IntegrationsPage() {
  return <IntegrationsSettings />;
}
