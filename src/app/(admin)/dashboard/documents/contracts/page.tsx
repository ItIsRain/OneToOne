"use client";
import React, { useState, useCallback } from "react";
import { ContractsTable, ContractDetailsSidebar } from "@/components/agency";
import { NewContractModal } from "@/components/agency/modals";
import FeatureGate from "@/components/ui/FeatureGate";
import type { ContractRecord } from "@/components/agency/ContractsTable";

export default function ContractsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editContract, setEditContract] = useState<ContractRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleContractSelect = (contract: ContractRecord) => {
    setSelectedContract(contract);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedContract(null);
  };

  const handleAddContract = () => {
    setEditContract(null);
    setIsModalOpen(true);
  };

  const handleEdit = (contract: ContractRecord) => {
    setEditContract(contract);
    setIsModalOpen(true);
    setSidebarOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/contracts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete contract");
      }

      // Refresh the list
      setRefreshKey((prev) => prev + 1);
      handleCloseSidebar();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete contract");
    }
  };

  const handleStatusChange = useCallback(async (contract: ContractRecord, newStatus: string) => {
    try {
      const res = await fetch(`/api/documents/contracts/${contract.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      // Refresh the list and sidebar
      setRefreshKey((prev) => prev + 1);

      // Update the selected contract with new status
      const data = await res.json();
      if (selectedContract?.id === contract.id) {
        setSelectedContract(data.contract);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  }, [selectedContract]);

  const handleSign = useCallback(async (contract: ContractRecord) => {
    if (!confirm("Are you sure you want to sign this contract?")) return;

    try {
      const res = await fetch(`/api/documents/contracts/${contract.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sign: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign contract");
      }

      // Refresh the list and sidebar
      setRefreshKey((prev) => prev + 1);

      // Update the selected contract
      const data = await res.json();
      if (selectedContract?.id === contract.id) {
        setSelectedContract(data.contract);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to sign contract");
    }
  }, [selectedContract]);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setEditContract(null);
  };

  return (
    <FeatureGate feature="document_templates">
      <>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Contracts</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage client contracts and agreements</p>
            </div>
          </div>

          <ContractsTable
            onContractSelect={handleContractSelect}
            selectedContract={selectedContract}
            onAddContract={handleAddContract}
            refreshKey={refreshKey}
          />
        </div>

        <NewContractModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditContract(null);
          }}
          onSuccess={handleSuccess}
          editContract={editContract}
        />

        <ContractDetailsSidebar
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          contract={selectedContract}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onSign={handleSign}
        />
      </>
    </FeatureGate>
  );
}
