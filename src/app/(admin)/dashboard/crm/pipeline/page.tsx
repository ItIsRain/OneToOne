"use client";
import React, { useState } from "react";
import { AddDealModal } from "@/components/agency/modals";

const pipelineStages = [
  {
    name: "Lead",
    color: "bg-gray-100 dark:bg-gray-800",
    deals: [
      { id: 1, name: "StartupIO Deal", value: "$15,000", company: "StartupIO" },
      { id: 2, name: "TechCorp Project", value: "$25,000", company: "TechCorp" },
    ],
  },
  {
    name: "Qualified",
    color: "bg-blue-light-50 dark:bg-blue-light-500/10",
    deals: [
      { id: 3, name: "Innovate Partnership", value: "$40,000", company: "Innovate Co" },
    ],
  },
  {
    name: "Proposal",
    color: "bg-warning-50 dark:bg-warning-500/10",
    deals: [
      { id: 4, name: "Enterprise Contract", value: "$80,000", company: "Enterprise Ltd" },
      { id: 5, name: "Growth Campaign", value: "$32,000", company: "GrowthIO" },
    ],
  },
  {
    name: "Negotiation",
    color: "bg-orange-50 dark:bg-orange-500/10",
    deals: [
      { id: 6, name: "Annual Retainer", value: "$120,000", company: "MegaCorp" },
    ],
  },
  {
    name: "Closed Won",
    color: "bg-success-50 dark:bg-success-500/10",
    deals: [
      { id: 7, name: "Q1 Campaign", value: "$45,000", company: "Acme Corp" },
    ],
  },
];

export default function PipelinePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Sales Pipeline</h1>
            <p className="text-gray-500 dark:text-gray-400">Track deals through your sales process</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Deal
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => (
            <div key={stage.name} className="min-w-[280px] flex-shrink-0">
              <div className={`rounded-xl ${stage.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{stage.name}</h3>
                  <span className="text-sm text-gray-500">{stage.deals.length}</span>
                </div>
                <div className="space-y-3">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <h4 className="font-medium text-gray-800 dark:text-white/90">{deal.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{deal.company}</p>
                      <p className="text-lg font-semibold text-brand-500 mt-2">{deal.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddDealModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
