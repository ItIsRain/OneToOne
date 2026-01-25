"use client";
import React from "react";
import Badge from "@/components/ui/badge/Badge";

const invoiceHistory = [
  { id: 1, date: "Jan 1, 2025", amount: "$49.00", status: "Paid" },
  { id: 2, date: "Dec 1, 2024", amount: "$49.00", status: "Paid" },
  { id: 3, date: "Nov 1, 2024", amount: "$49.00", status: "Paid" },
  { id: 4, date: "Oct 1, 2024", amount: "$49.00", status: "Paid" },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Billing</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your subscription and payment methods</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white/90">Current Plan</h3>
            <p className="text-sm text-gray-500">You are currently on the Professional plan</p>
          </div>
          <Badge color="primary">Professional</Badge>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <div>
            <p className="text-sm text-gray-500">Monthly Price</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white/90">$49/mo</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Billing Date</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">Feb 1, 2025</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">6 / 10</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            Upgrade Plan
          </button>
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            View Plans
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Payment Method</h3>
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-16 items-center justify-center rounded bg-gray-100 text-sm font-bold text-gray-600 dark:bg-gray-800">
              VISA
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-500">Expires 12/26</p>
            </div>
          </div>
          <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">Update</button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Billing History</h3>
        <div className="space-y-3">
          {invoiceHistory.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">{invoice.date}</p>
                <p className="text-sm text-gray-500">Professional Plan</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-800 dark:text-white/90">{invoice.amount}</span>
                <Badge size="sm" color="success">{invoice.status}</Badge>
                <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
