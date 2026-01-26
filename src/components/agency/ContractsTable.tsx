"use client";
import React, { useState, useEffect, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";

export interface ContractRecord {
  id: string;
  contract_number: string | null;
  name: string;
  contract_type: string;
  category: string | null;
  client_id: string | null;
  project_id: string | null;
  value: number | null;
  currency: string;
  payment_terms: string | null;
  start_date: string | null;
  end_date: string | null;
  signed_date: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  renewal_period: string | null;
  renewal_notice_days: number | null;
  status: string;
  document_url: string | null;
  document_file_id: string | null;
  is_signed: boolean;
  signature_required: boolean;
  signatory_name: string | null;
  signatory_email: string | null;
  signatory_title: string | null;
  description: string | null;
  terms_and_conditions: string | null;
  special_clauses: string | null;
  internal_notes: string | null;
  reminder_enabled: boolean;
  reminder_days_before: number | null;
  tags: string[];
  deliverables: Array<{ name: string; description?: string }>;
  milestones: Array<{ name: string; date?: string; amount?: number }>;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
    project_code: string | null;
  } | null;
}

interface ContractStats {
  total: number;
  by_status: {
    draft: number;
    pending_signature: number;
    active: number;
    expired: number;
    terminated: number;
  };
  total_value: number;
  expiring_soon: number;
}

interface ContractsTableProps {
  onContractSelect?: (contract: ContractRecord) => void;
  selectedContract?: ContractRecord | null;
  onAddContract?: () => void;
  refreshKey?: number;
}

const statusColors: Record<string, "success" | "warning" | "error" | "primary" | "light"> = {
  draft: "light",
  pending_review: "warning",
  pending_signature: "warning",
  active: "success",
  expired: "error",
  terminated: "error",
  cancelled: "light",
  on_hold: "warning",
};

const contractTypeLabels: Record<string, string> = {
  service_agreement: "Service Agreement",
  project_contract: "Project Contract",
  retainer: "Retainer",
  nda: "NDA",
  partnership: "Partnership",
  employment: "Employment",
  vendor: "Vendor",
  licensing: "Licensing",
  other: "Other",
};

export const ContractsTable: React.FC<ContractsTableProps> = ({
  onContractSelect,
  selectedContract,
  onAddContract,
  refreshKey = 0,
}) => {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.append("contract_type", typeFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await fetch(`/api/documents/contracts?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch contracts");
      }

      setContracts(data.contracts || []);
      setStats(data.stats || null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts, refreshKey]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this contract?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/contracts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete contract");
      }

      setContracts(contracts.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number | null, currency: string = "USD") => {
    if (value === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return end >= now && end <= thirtyDaysFromNow;
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
        <p className="text-error-600 dark:text-error-400">{error}</p>
        <button
          onClick={fetchContracts}
          className="mt-2 text-sm text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Contracts</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Value</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">
              {formatCurrency(stats.total_value)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Signature</p>
            <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
              {stats.by_status.pending_signature}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Expiring Soon</p>
            <p className="text-2xl font-bold text-error-600 dark:text-error-400">
              {stats.expiring_soon}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Contracts
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-400">
              {contracts.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-800" : ""}`}
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-800" : ""}`}
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {onAddContract && (
              <button
                onClick={onAddContract}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Contract
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 p-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_signature">Pending Signature</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            {Object.entries(contractTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="p-4">
          {contracts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-1">
                No contracts found
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first contract"}
              </p>
              {onAddContract && !searchQuery && statusFilter === "all" && typeFilter === "all" && (
                <button
                  onClick={onAddContract}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Contract
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  onClick={() => onContractSelect?.(contract)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedContract?.id === contract.id
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {contract.contract_number || "No number"}
                      </p>
                      <h4 className="font-medium text-gray-800 dark:text-white/90 truncate">
                        {contract.name}
                      </h4>
                    </div>
                    <Badge size="sm" color={statusColors[contract.status] || "light"}>
                      {contract.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="truncate">
                        {contract.client?.name || contract.client?.company || "No client"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{contractTypeLabels[contract.contract_type] || contract.contract_type}</span>
                    </div>

                    {contract.value !== null && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {formatCurrency(contract.value, contract.currency)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {contract.end_date && (
                        <span className={isExpired(contract.end_date) ? "text-error-500" : isExpiringSoon(contract.end_date) ? "text-warning-500" : ""}>
                          Ends: {formatDate(contract.end_date)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {contract.is_signed && (
                        <span className="text-success-500" title="Signed">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        </span>
                      )}
                      {contract.document_url && (
                        <a
                          href={contract.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-gray-400 hover:text-brand-500"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={(e) => handleDelete(contract.id, e)}
                        disabled={deletingId === contract.id}
                        className="p-1 text-gray-400 hover:text-error-500"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Contract
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Value
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      End Date
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      onClick={() => onContractSelect?.(contract)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        selectedContract?.id === contract.id ? "bg-brand-50 dark:bg-brand-500/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {contract.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {contract.contract_number}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {contract.client?.name || contract.client?.company || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {contractTypeLabels[contract.contract_type] || contract.contract_type}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white">
                        {formatCurrency(contract.value, contract.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge size="sm" color={statusColors[contract.status] || "light"}>
                          {contract.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className={isExpired(contract.end_date) ? "text-error-500" : isExpiringSoon(contract.end_date) ? "text-warning-500" : ""}>
                          {formatDate(contract.end_date)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {contract.document_url && (
                            <a
                              href={contract.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-gray-400 hover:text-brand-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={(e) => handleDelete(contract.id, e)}
                            disabled={deletingId === contract.id}
                            className="p-1 text-gray-400 hover:text-error-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
