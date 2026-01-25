"use client";
import React from "react";
import { ArrowUpIcon, ArrowDownIcon, DollarLineIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";

const stats = [
  { label: "Total Revenue", value: "$124,500", change: "+12.5%", trend: "up" },
  { label: "Outstanding", value: "$18,200", change: "-5.2%", trend: "down" },
  { label: "Expenses", value: "$42,300", change: "+8.1%", trend: "up" },
  { label: "Net Profit", value: "$82,200", change: "+15.3%", trend: "up" },
];

const recentTransactions = [
  { id: 1, description: "Payment from Acme Corp", type: "income", amount: "+$4,500", date: "Jan 25, 2025" },
  { id: 2, description: "Venue Booking - Grand Ballroom", type: "expense", amount: "-$3,000", date: "Jan 24, 2025" },
  { id: 3, description: "Payment from TechStart", type: "income", amount: "+$12,800", date: "Jan 23, 2025" },
  { id: 4, description: "Software Subscription", type: "expense", amount: "-$299", date: "Jan 22, 2025" },
  { id: 5, description: "Payment from Metro Events", type: "income", amount: "+$15,000", date: "Jan 20, 2025" },
];

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Financial Overview</h1>
        <p className="text-gray-500 dark:text-gray-400">Track your revenue, expenses, and cash flow</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">{stat.value}</h3>
              <Badge color={stat.trend === "up" ? "success" : "error"}>
                {stat.trend === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {stat.change}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === "income" ? "bg-success-100 dark:bg-success-500/20" : "bg-error-100 dark:bg-error-500/20"
                }`}>
                  <DollarLineIcon className={`w-5 h-5 ${tx.type === "income" ? "text-success-500" : "text-error-500"}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">{tx.description}</p>
                  <p className="text-sm text-gray-500">{tx.date}</p>
                </div>
              </div>
              <span className={`font-semibold ${tx.type === "income" ? "text-success-500" : "text-error-500"}`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
