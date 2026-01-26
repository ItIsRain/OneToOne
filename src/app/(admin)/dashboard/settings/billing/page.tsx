"use client";
import React, { Suspense } from "react";
import { BillingSettings } from "@/components/agency";

function BillingSettingsLoading() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Billing</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your subscription and payment methods</p>
      </div>

      <Suspense fallback={<BillingSettingsLoading />}>
        <BillingSettings />
      </Suspense>
    </div>
  );
}
