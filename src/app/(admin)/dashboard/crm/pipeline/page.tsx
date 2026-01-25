"use client";
import React from "react";
import { SalesPipeline } from "@/components/agency/SalesPipeline";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Sales Pipeline</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Track and manage deals through your sales process
        </p>
      </div>

      <SalesPipeline />
    </div>
  );
}
