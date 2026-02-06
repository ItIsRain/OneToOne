"use client";
import { ExpensesTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function ExpensesPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.EXPENSES_VIEW}>
      <FeatureGate feature="expenses">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Expenses
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Track and manage all business expenses
            </p>
          </div>
          <ExpensesTable />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
