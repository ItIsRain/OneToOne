"use client";
import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

const salesData = [
  { month: "Jan", revenue: 45000, deals: 12, conversion: 28 },
  { month: "Feb", revenue: 52000, deals: 15, conversion: 32 },
  { month: "Mar", revenue: 48000, deals: 11, conversion: 25 },
  { month: "Apr", revenue: 61000, deals: 18, conversion: 35 },
];

const topClients = [
  { name: "Acme Corporation", revenue: "$45,200", deals: 4 },
  { name: "TechStart Inc.", revenue: "$32,800", deals: 3 },
  { name: "Metro Events", revenue: "$28,500", deals: 5 },
  { name: "GlobalTech Solutions", revenue: "$24,300", deals: 2 },
];

export default function SalesReportsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.REPORTS_VIEW}>
      <FeatureGate feature="advanced_analytics">
        <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Sales Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">Track sales performance and trends</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">$206,000</h3>
          <div className="mt-2">
            <Badge color="success"><ArrowUpIcon /> +18.2%</Badge>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Deals Closed</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">56</h3>
          <div className="mt-2">
            <Badge color="success"><ArrowUpIcon /> +12 this month</Badge>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Avg Deal Size</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">$3,678</h3>
          <div className="mt-2">
            <Badge color="success"><ArrowUpIcon /> +5.4%</Badge>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">30%</h3>
          <div className="mt-2">
            <Badge color="error"><ArrowDownIcon /> -2.1%</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Monthly Revenue</h3>
          <div className="space-y-4">
            {salesData.map((item) => (
              <div key={item.month} className="flex items-center gap-4">
                <span className="w-12 text-sm text-gray-500">{item.month}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-lg"
                    style={{ width: `${(item.revenue / 70000) * 100}%` }}
                  />
                </div>
                <span className="w-24 text-right font-medium text-gray-800 dark:text-white/90">
                  ${(item.revenue / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="font-semibold text-gray-800 dark:text-white/90 mb-4">Top Clients</h3>
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={client.name} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-sm font-medium flex items-center justify-center dark:bg-brand-500/20 dark:text-brand-400">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white/90">{client.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800 dark:text-white/90">{client.revenue}</p>
                  <p className="text-xs text-gray-500">{client.deals} deals</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
