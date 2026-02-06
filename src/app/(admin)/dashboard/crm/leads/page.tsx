"use client";
import React from "react";
import { LeadsTable } from "@/components/agency/LeadsTable";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function LeadsPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.CRM_VIEW}>
      <FeatureGate feature="crm">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Leads</h1>
            <p className="text-gray-500 dark:text-gray-400">Track and convert potential clients</p>
          </div>

          <LeadsTable />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
