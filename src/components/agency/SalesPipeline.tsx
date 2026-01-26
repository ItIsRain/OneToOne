"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AddLeadModal } from "./modals";
import { LeadDetailsSidebar } from "./sidebars";
import type { Lead } from "./LeadsTable";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "new",
    name: "New",
    color: "bg-gray-500",
    borderColor: "border-gray-200 dark:border-gray-700",
    textColor: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-800/50",
  },
  {
    id: "contacted",
    name: "Contacted",
    color: "bg-blue-500",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "qualified",
    name: "Qualified",
    color: "bg-purple-500",
    borderColor: "border-purple-200 dark:border-purple-800",
    textColor: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    id: "proposal",
    name: "Proposal",
    color: "bg-amber-500",
    borderColor: "border-amber-200 dark:border-amber-800",
    textColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    id: "negotiation",
    name: "Negotiation",
    color: "bg-orange-500",
    borderColor: "border-orange-200 dark:border-orange-800",
    textColor: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    id: "won",
    name: "Won",
    color: "bg-green-500",
    borderColor: "border-green-200 dark:border-green-800",
    textColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  {
    id: "lost",
    name: "Lost",
    color: "bg-red-500",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
];

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

function formatFullCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPriorityDot(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-blue-500";
    default:
      return "bg-gray-400";
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export const SalesPipeline = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch leads");
      }

      setLeads(data.leads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    // Optimistically update the UI
    const updatedLeads = leads.map((lead) =>
      lead.id === draggedLead.id
        ? { ...lead, status: newStatus as Lead["status"] }
        : lead
    );
    setLeads(updatedLeads);

    try {
      const res = await fetch(`/api/leads/${draggedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        setLeads(leads);
        const data = await res.json();
        throw new Error(data.error || "Failed to update lead status");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update lead status");
      setLeads(leads); // Revert
    }

    setDraggedLead(null);
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleLeadSaved = (lead: Lead) => {
    if (editingLead) {
      setLeads(leads.map((l) => (l.id === lead.id ? lead : l)));
    } else {
      setLeads([lead, ...leads]);
    }
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleEditLead = (lead: Lead) => {
    setViewingLead(null);
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  // Group leads by status
  const leadsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = leads.filter((lead) => lead.status === stage.id);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Calculate stats
  const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.status));
  const totalPipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const weightedPipelineValue = activeLeads.reduce(
    (sum, l) => sum + ((l.estimated_value || 0) * (l.probability || 0)) / 100,
    0
  );
  const wonLeads = leads.filter((l) => l.status === "won");
  const lostLeads = leads.filter((l) => l.status === "lost");
  const closedLeads = wonLeads.length + lostLeads.length;
  const winRate = closedLeads > 0 ? Math.round((wonLeads.length / closedLeads) * 100) : 0;
  const wonValue = wonLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.slice(0, 5).map((stage) => (
            <div key={stage.id} className="min-w-[300px] flex-shrink-0">
              <div className="animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 p-4 h-96" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button onClick={fetchLeads} className="mt-2 text-brand-500 hover:text-brand-600">
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pipeline Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatFullCurrency(totalPipelineValue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{activeLeads.length} active deals</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Weighted Value</p>
          <p className="text-2xl font-bold text-brand-500 mt-1">
            {formatFullCurrency(weightedPipelineValue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Based on probability</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{winRate}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {wonLeads.length} won / {closedLeads} closed
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Won Revenue</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{formatFullCurrency(wonValue)}</p>
          <p className="text-xs text-gray-400 mt-1">Total closed won</p>
        </div>
      </div>

      {/* Add Deal Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAddLead}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Deal
        </button>
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leadsByStage[stage.id] || [];
          const stageValue = stageLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
          const isDropTarget = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              className="min-w-[300px] w-[300px] flex-shrink-0"
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div
                className={`rounded-xl border-2 transition-all duration-200 ${
                  isDropTarget
                    ? `${stage.borderColor} border-dashed ${stage.bgColor}`
                    : "border-transparent"
                }`}
              >
                {/* Stage Header */}
                <div className={`rounded-t-xl ${stage.bgColor} px-4 py-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <h3 className={`font-semibold ${stage.textColor}`}>{stage.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${stage.textColor}`}>
                        {stageLeads.length}
                      </span>
                    </div>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatCurrency(stageValue)} total
                    </p>
                  )}
                </div>

                {/* Cards Container */}
                <div
                  className={`p-2 min-h-[400px] rounded-b-xl transition-colors ${
                    isDropTarget ? stage.bgColor : "bg-gray-50/50 dark:bg-gray-900/30"
                  }`}
                >
                  <div className="space-y-2">
                    {stageLeads.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-sm text-gray-400 dark:text-gray-600">
                        {isDropTarget ? "Drop here" : "No deals"}
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onClick={() => setViewingLead(lead)}
                          className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm cursor-pointer
                            hover:shadow-md hover:border-gray-300 transition-all duration-200
                            dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600
                            ${draggedLead?.id === lead.id ? "opacity-50 scale-95" : ""}`}
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-gray-800 dark:text-white/90 text-sm leading-tight">
                              {lead.name}
                            </h4>
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${getPriorityDot(
                                lead.priority
                              )}`}
                              title={`${lead.priority} priority`}
                            />
                          </div>

                          {/* Company */}
                          {lead.company && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                              {lead.company}
                            </p>
                          )}

                          {/* Value & Probability */}
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-brand-500">
                              {formatCurrency(lead.estimated_value || 0)}
                            </span>
                            {lead.probability > 0 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {lead.probability}% likely
                              </span>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {getTimeAgo(lead.created_at)}
                            </span>
                            {lead.next_follow_up && (
                              <span className="text-xs text-amber-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Follow-up
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {leads.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No deals in pipeline</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding your first deal.
          </p>
          <button
            onClick={handleAddLead}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add Deal
          </button>
        </div>
      )}

      {/* Modals */}
      <AddLeadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
        }}
        onSave={handleLeadSaved}
        lead={editingLead}
      />

      <LeadDetailsSidebar
        isOpen={!!viewingLead}
        onClose={() => setViewingLead(null)}
        lead={viewingLead}
        onEdit={handleEditLead}
      />
    </>
  );
};
