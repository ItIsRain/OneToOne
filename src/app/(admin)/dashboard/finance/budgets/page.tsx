"use client";
import React, { useState } from "react";
import { CreateBudgetModal } from "@/components/agency/modals";

const budgets = [
  { id: 1, name: "Marketing", allocated: 25000, spent: 18500, remaining: 6500 },
  { id: 2, name: "Operations", allocated: 15000, spent: 12300, remaining: 2700 },
  { id: 3, name: "Events", allocated: 50000, spent: 32000, remaining: 18000 },
  { id: 4, name: "Technology", allocated: 10000, spent: 4500, remaining: 5500 },
  { id: 5, name: "Travel", allocated: 8000, spent: 6200, remaining: 1800 },
];

export default function BudgetsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Budgets</h1>
            <p className="text-gray-500 dark:text-gray-400">Track and manage department budgets</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Create Budget
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">Total Budget</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">$108,000</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">Total Spent</p>
            <h3 className="text-2xl font-bold text-warning-500 mt-1">$73,500</h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500">Remaining</p>
            <h3 className="text-2xl font-bold text-success-500 mt-1">$34,500</h3>
          </div>
        </div>

        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentSpent = (budget.spent / budget.allocated) * 100;
            return (
              <div key={budget.id} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{budget.name}</h3>
                  <span className={`text-sm font-medium ${percentSpent > 80 ? "text-error-500" : "text-gray-500"}`}>
                    {percentSpent.toFixed(0)}% used
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <div
                    className={`h-3 rounded-full ${percentSpent > 80 ? "bg-error-500" : "bg-brand-500"}`}
                    style={{ width: `${percentSpent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Allocated: </span>
                    <span className="font-medium text-gray-800 dark:text-white/90">${budget.allocated.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Spent: </span>
                    <span className="font-medium text-gray-800 dark:text-white/90">${budget.spent.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Remaining: </span>
                    <span className="font-medium text-success-500">${budget.remaining.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CreateBudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
