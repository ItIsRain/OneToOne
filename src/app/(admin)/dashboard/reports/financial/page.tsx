"use client";
import React from "react";
import { FeatureGate } from "@/components/ui/FeatureGate";

const financialData = {
  revenue: { current: 124500, previous: 108000 },
  expenses: { current: 42300, previous: 38500 },
  profit: { current: 82200, previous: 69500 },
  outstanding: { current: 18200, previous: 24800 },
};

const expenseBreakdown = [
  { category: "Venues", amount: 15000, percentage: 35 },
  { category: "Marketing", amount: 8500, percentage: 20 },
  { category: "Technology", amount: 6400, percentage: 15 },
  { category: "Personnel", amount: 7200, percentage: 17 },
  { category: "Other", amount: 5200, percentage: 13 },
];

export default function FinancialReportsPage() {
  return (
    <FeatureGate feature="advanced_analytics">
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Financial Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Detailed financial analysis and trends</p>
        </div>
        <button className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          Export Report
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(financialData).map(([key, value]) => {
          const change = ((value.current - value.previous) / value.previous * 100).toFixed(1);
          const isPositive = key === "outstanding" ? Number(change) < 0 : Number(change) > 0;
          return (
            <div key={key} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">
                ${value.current.toLocaleString()}
              </h3>
              <p className={`text-sm mt-2 ${isPositive ? "text-success-500" : "text-error-500"}`}>
                {isPositive ? "↑" : "↓"} {Math.abs(Number(change))}% vs last period
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Expense Breakdown</h3>
          <div className="space-y-4">
            {expenseBreakdown.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.category}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    ${item.amount.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Profit Margin Trend</h3>
          <div className="h-64 flex items-end gap-4">
            {["Q1", "Q2", "Q3", "Q4"].map((quarter, index) => {
              const heights = [60, 68, 72, 66];
              return (
                <div key={quarter} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-brand-500 rounded-t-lg"
                    style={{ height: `${heights[index]}%` }}
                  />
                  <span className="text-xs text-gray-500">{quarter}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
