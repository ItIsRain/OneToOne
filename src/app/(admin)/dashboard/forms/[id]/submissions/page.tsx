"use client";
import { use } from "react";
import { FormSubmissionsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <FeatureGate feature="forms">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Form Submissions
          </h1>
        </div>
        <FormSubmissionsTable formId={id} />
      </div>
    </FeatureGate>
  );
}
