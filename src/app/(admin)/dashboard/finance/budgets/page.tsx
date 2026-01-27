"use client";
import { BudgetsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function BudgetsPage() {
  return (
    <FeatureGate feature="budgets">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Budgets
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track and manage department budgets
          </p>
        </div>
        <BudgetsTable />
      </div>
    </FeatureGate>
  );
}
