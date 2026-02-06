"use client";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { SurveysTable } from "@/components/agency";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function SurveysPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.FORMS_VIEW}>
      <FeatureGate feature="surveys">
        <SurveysTable />
      </FeatureGate>
    </ProtectedPage>
  );
}
