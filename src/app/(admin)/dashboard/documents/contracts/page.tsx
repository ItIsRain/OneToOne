"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { NewContractModal } from "@/components/agency/modals";

const contracts = [
  { id: 1, name: "Service Agreement - Acme Corp", client: "Acme Corporation", value: "$45,000", status: "Active", startDate: "Jan 1, 2025", endDate: "Dec 31, 2025" },
  { id: 2, name: "Event Contract - TechStart", client: "TechStart Inc.", value: "$12,800", status: "Active", startDate: "Feb 1, 2025", endDate: "Feb 28, 2025" },
  { id: 3, name: "Retainer Agreement - Metro", client: "Metro Events", value: "$60,000", status: "Pending Signature", startDate: "Mar 1, 2025", endDate: "Feb 28, 2026" },
  { id: 4, name: "Project Contract - Creative", client: "Creative Co.", value: "$8,500", status: "Expired", startDate: "Oct 1, 2024", endDate: "Dec 31, 2024" },
  { id: 5, name: "NDA - GlobalTech", client: "GlobalTech Solutions", value: "N/A", status: "Active", startDate: "Jan 15, 2025", endDate: "Jan 14, 2027" },
];

export default function ContractsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Contracts</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage client contracts and agreements</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            New Contract
          </button>
        </div>

        <div className="space-y-4">
          {contracts.map((contract) => (
            <div key={contract.id} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">{contract.name}</h3>
                    <Badge size="sm" color={
                      contract.status === "Active" ? "success" :
                      contract.status === "Pending Signature" ? "warning" : "error"
                    }>
                      {contract.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{contract.client}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800 dark:text-white/90">{contract.value}</p>
                  <p className="text-xs text-gray-500">{contract.startDate} - {contract.endDate}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">View</button>
                <button className="text-brand-500 hover:text-brand-600 text-sm font-medium">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewContractModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
