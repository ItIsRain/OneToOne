"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContractsTable } from "@/components/agency";
import { CreateContractModal } from "@/components/agency/modals";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default function ContractsPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ProtectedPage permission={PERMISSIONS.CONTRACTS_VIEW}>
      <FeatureGate feature="contracts">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Contracts
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create and manage client contracts
          </p>
        </div>
        <ContractsTable
          onAddContract={() => setShowCreateModal(true)}
          onContractSelect={(contract) =>
            router.push(`/dashboard/contracts/${contract.id}`)
          }
          refreshKey={refreshKey}
        />
      </div>

      <CreateContractModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(contractId) => {
          setShowCreateModal(false);
          setRefreshKey((k) => k + 1);
          router.push(`/dashboard/contracts/${contractId}`);
        }}
      />
      </FeatureGate>
    </ProtectedPage>
  );
}
