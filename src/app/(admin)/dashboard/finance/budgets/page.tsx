import type { Metadata } from "next";
import { BudgetsTable } from "@/components/agency";

export const metadata: Metadata = {
  title: "Budgets | Finance",
  description: "Track and manage department budgets",
};

export default function BudgetsPage() {
  return (
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
  );
}
