"use client";
import { PaymentsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function PaymentsPage() {
  return (
    <FeatureGate feature="payments">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Payments
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Record and track all payments received
          </p>
        </div>
        <PaymentsTable />
      </div>
    </FeatureGate>
  );
}
