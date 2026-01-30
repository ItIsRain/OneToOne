import { FeatureGate } from "@/components/ui/FeatureGate";
import { SurveysTable } from "@/components/agency";

export default function SurveysPage() {
  return (
    <FeatureGate feature="surveys">
      <SurveysTable />
    </FeatureGate>
  );
}
