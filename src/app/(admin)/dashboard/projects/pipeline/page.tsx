"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FeatureGate } from "@/components/ui/FeatureGate";
import { ProtectedPage } from "@/components/auth";
import { PERMISSIONS } from "@/lib/permissions";

interface Proposal {
  id: string;
  title: string;
  status: string;
  total: number;
  currency: string;
  client_id: string | null;
}

interface PipelineStatus {
  proposal: { id: string; title: string; status: string; total: number; currency: string } | null;
  contract: { id: string; name: string; status: string; value: number; currency: string; is_signed: boolean } | null;
  project: { id: string; name: string; status: string; budget: number; currency: string } | null;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    notes: string | null;
    due_date: string | null;
    tags: string[];
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    reference_number: string | null;
    title: string;
    total: number;
    status: string;
    currency: string;
  }>;
  current_stage: string;
}

const stages = [
  { key: "proposal", label: "Proposal", description: "Accepted proposal" },
  { key: "contract", label: "Contract", description: "Draft → Signed" },
  { key: "project", label: "Project", description: "Tasks & Milestones" },
  { key: "invoicing", label: "Invoicing", description: "Milestone invoices" },
];

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function StageNode({
  stage,
  isActive,
  isCompleted,
}: {
  stage: (typeof stages)[number];
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
          isCompleted
            ? "border-green-500 bg-green-500 text-white"
            : isActive
              ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800"
        }`}
      >
        {isCompleted ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-sm font-bold">
            {stages.findIndex((s) => s.key === stage.key) + 1}
          </span>
        )}
      </div>
      <p className={`mt-2 text-sm font-medium ${isActive ? "text-blue-600 dark:text-blue-400" : isCompleted ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>
        {stage.label}
      </p>
      <p className="text-xs text-gray-400">{stage.description}</p>
    </div>
  );
}

function PipelineContent() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch accepted proposals
  useEffect(() => {
    async function fetchProposals() {
      try {
        const res = await fetch("/api/proposals");
        if (res.ok) {
          const data = await res.json();
          const accepted = (data.proposals || []).filter(
            (p: Proposal) => p.status === "accepted"
          );
          setProposals(accepted);
        }
      } catch {
        console.error("Failed to fetch proposals");
      }
    }
    fetchProposals();
  }, []);

  const fetchStatus = useCallback(async (proposalId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pipeline/status?proposal_id=${proposalId}`);
      if (res.ok) {
        const data = await res.json();
        setPipelineStatus(data);
      }
    } catch {
      console.error("Failed to fetch pipeline status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProposalId) {
      fetchStatus(selectedProposalId);
    } else {
      setPipelineStatus(null);
    }
  }, [selectedProposalId, fetchStatus]);

  const handleGenerateContract = async () => {
    if (!selectedProposalId) return;
    setActionLoading("contract");
    try {
      const res = await fetch("/api/pipeline/proposal-to-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: selectedProposalId }),
      });
      if (res.ok) {
        fetchStatus(selectedProposalId);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to generate contract");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateProject = async () => {
    if (!pipelineStatus?.contract) return;
    setActionLoading("project");
    try {
      const res = await fetch("/api/pipeline/contract-to-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_id: pipelineStatus.contract.id }),
      });
      if (res.ok) {
        fetchStatus(selectedProposalId);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create project");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateInvoice = async (taskId: string) => {
    setActionLoading(`invoice-${taskId}`);
    try {
      const res = await fetch("/api/pipeline/milestone-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });
      if (res.ok) {
        fetchStatus(selectedProposalId);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to generate invoice");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const stageIndex = stages.findIndex(
    (s) => s.key === (pipelineStatus?.current_stage || "proposal")
  );

  const pipelineValue =
    pipelineStatus?.proposal?.total ||
    pipelineStatus?.contract?.value ||
    pipelineStatus?.project?.budget ||
    0;
  const currency =
    pipelineStatus?.proposal?.currency ||
    pipelineStatus?.contract?.currency ||
    "USD";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          SOW Pipeline
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track proposals through contracts, projects, and invoicing
        </p>
      </div>

      {/* Proposal Selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select an accepted proposal
        </label>
        <select
          value={selectedProposalId}
          onChange={(e) => setSelectedProposalId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Choose a proposal...</option>
          {proposals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({formatCurrency(p.total, p.currency)})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {pipelineStatus && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Pipeline Value
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(pipelineValue, currency)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Stages Completed
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stageIndex + 1} / {stages.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Invoices Generated
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {pipelineStatus.invoices.length}
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              {stages.map((stage, i) => (
                <React.Fragment key={stage.key}>
                  <StageNode
                    stage={stage}
                    isActive={stage.key === pipelineStatus.current_stage}
                    isCompleted={i < stageIndex}
                  />
                  {i < stages.length - 1 && (
                    <div className="mt-6 flex-1 px-2">
                      <div
                        className={`h-0.5 w-full ${
                          i < stageIndex
                            ? "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Stage Action */}
            <div className="mt-6 flex justify-center">
              {!pipelineStatus.contract && pipelineStatus.proposal && (
                <button
                  onClick={handleGenerateContract}
                  disabled={actionLoading === "contract"}
                  className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === "contract"
                    ? "Generating..."
                    : "Generate Contract"}
                </button>
              )}
              {pipelineStatus.contract &&
                !pipelineStatus.project &&
                (pipelineStatus.contract.is_signed ||
                  pipelineStatus.contract.status === "active") && (
                  <button
                    onClick={handleCreateProject}
                    disabled={actionLoading === "project"}
                    className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "project"
                      ? "Creating..."
                      : "Create Project from Contract"}
                  </button>
                )}
              {pipelineStatus.contract &&
                !pipelineStatus.project &&
                !pipelineStatus.contract.is_signed &&
                pipelineStatus.contract.status !== "active" && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Contract needs to be signed before creating a project.{" "}
                    <a
                      href={`/dashboard/contracts/${pipelineStatus.contract.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      View Contract
                    </a>
                  </p>
                )}
            </div>
          </div>

          {/* Milestones Table */}
          {pipelineStatus.milestones.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Milestones
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Milestone
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Amount
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Invoice
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineStatus.milestones.map((ms) => {
                      const amountMatch = (ms.notes || "").match(
                        /\[milestone_amount:([\d.]+)\]/
                      );
                      const amount = amountMatch
                        ? parseFloat(amountMatch[1])
                        : 0;
                      const refNumber = `PIPE-MS-${ms.id.substring(0, 8)}`;
                      const linkedInvoice = pipelineStatus.invoices.find(
                        (inv) => inv.reference_number === refNumber
                      );
                      const isPaymentMilestone =
                        Array.isArray(ms.tags) &&
                        ms.tags.includes("pipeline:payment");
                      const isCompleted = ms.status === "completed";

                      return (
                        <tr
                          key={ms.id}
                          className="border-b border-gray-100 dark:border-gray-700/50"
                        >
                          <td className="px-6 py-3 text-gray-900 dark:text-white">
                            {ms.title}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                isCompleted
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {ms.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-900 dark:text-white">
                            {amount > 0
                              ? formatCurrency(amount, currency)
                              : "-"}
                          </td>
                          <td className="px-6 py-3">
                            {linkedInvoice ? (
                              <a
                                href={`/dashboard/finance/invoices/${linkedInvoice.id}`}
                                className="text-blue-500 hover:underline"
                              >
                                {linkedInvoice.invoice_number} (
                                {linkedInvoice.status})
                              </a>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            {isPaymentMilestone &&
                              isCompleted &&
                              !linkedInvoice &&
                              amount > 0 && (
                                <button
                                  onClick={() => handleGenerateInvoice(ms.id)}
                                  disabled={
                                    actionLoading === `invoice-${ms.id}`
                                  }
                                  className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                                >
                                  {actionLoading === `invoice-${ms.id}`
                                    ? "Generating..."
                                    : "Generate Invoice"}
                                </button>
                              )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Entity Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {pipelineStatus.proposal && (
              <a
                href={`/dashboard/proposals/${pipelineStatus.proposal.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Proposal
                </p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white truncate">
                  {pipelineStatus.proposal.title}
                </p>
                <p className="text-sm text-gray-500">
                  {pipelineStatus.proposal.status}
                </p>
              </a>
            )}
            {pipelineStatus.contract && (
              <a
                href={`/dashboard/contracts/${pipelineStatus.contract.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Contract
                </p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white truncate">
                  {pipelineStatus.contract.name}
                </p>
                <p className="text-sm text-gray-500">
                  {pipelineStatus.contract.status}
                  {pipelineStatus.contract.is_signed ? " (Signed)" : ""}
                </p>
              </a>
            )}
            {pipelineStatus.project && (
              <a
                href={`/dashboard/projects/${pipelineStatus.project.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Project
                </p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white truncate">
                  {pipelineStatus.project.name}
                </p>
                <p className="text-sm text-gray-500">
                  {pipelineStatus.project.status}
                </p>
              </a>
            )}
          </div>
        </>
      )}

      {!selectedProposalId && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 dark:border-gray-600">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">
            Select a proposal to view its pipeline
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Only accepted proposals can be tracked through the pipeline
          </p>
        </div>
      )}
    </div>
  );
}

export default function PipelinePage() {
  return (
    <ProtectedPage permission={PERMISSIONS.PROJECTS_VIEW}>
      <FeatureGate feature="sow_pipeline">
        <PipelineContent />
      </FeatureGate>
    </ProtectedPage>
  );
}
