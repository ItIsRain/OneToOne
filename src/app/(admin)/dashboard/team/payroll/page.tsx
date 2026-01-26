"use client";
import React from "react";
import { PayrollTable } from "@/components/agency";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Payroll</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage employee salaries and payments</p>
        </div>
      </div>

      <PayrollTable />
    </div>
  );
}
