"use client";
import { ClientsTable } from "@/components/agency";
import { FeatureGate } from "@/components/ui/FeatureGate";

export default function ClientsPage() {
  return (
    <FeatureGate feature="crm">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Clients
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and track all your client relationships
          </p>
        </div>
        <ClientsTable />
      </div>
    </FeatureGate>
  );
}
