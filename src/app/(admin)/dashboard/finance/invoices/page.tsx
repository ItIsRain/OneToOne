"use client";
import { InvoicesTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function InvoicesPage() {
  return (
    <ProtectedPage permission={PERMISSIONS.FINANCE_VIEW}>
      <FeatureGate feature="invoicing">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Invoices</h1>
            <p className="text-gray-500 dark:text-gray-400">Create, send, and track all invoices</p>
          </div>
          <InvoicesTable />
        </div>
      </FeatureGate>
    </ProtectedPage>
  );
}
