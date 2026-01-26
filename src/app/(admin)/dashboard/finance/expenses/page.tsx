import type { Metadata } from "next";
import { ExpensesTable } from "@/components/agency";

export const metadata: Metadata = {
  title: "Expenses | Finance",
  description: "Track and manage business expenses",
};

export default function ExpensesPage() {
  return (
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
  );
}
