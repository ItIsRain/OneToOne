"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { AddLeadModal, ImportDataModal } from "./modals";
import { LeadDetailsSidebar } from "./sidebars";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  estimated_value: number;
  probability: number;
  priority: "low" | "medium" | "high" | "urgent";
  score: number;
  source: string | null;
  campaign: string | null;
  referral_source: string | null;
  industry: string | null;
  company_size: string | null;
  budget_range: string | null;
  next_follow_up: string | null;
  last_contacted: string | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  notes: string | null;
  requirements: string | null;
  pain_points: string | null;
  competitor_info: string | null;
  lost_reason: string | null;
  tags: string[] | null;
  services_interested: string[] | null;
  converted_to_client_id: string | null;
  conversion_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

function capitalizeName(str: string | null): string {
  if (!str) return "-";
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export const LeadsTable = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const handleViewLead = (lead: Lead) => {
    setViewingLead(lead);
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete lead");
      }

      setLeads(leads.filter(l => l.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete lead");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleLeadSaved = (lead: Lead) => {
    if (editingLead) {
      setLeads(leads.map(l => l.id === lead.id ? lead : l));
    } else {
      setLeads([lead, ...leads]);
    }
    handleModalClose();
  };

  const formatValue = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "primary" | "light" => {
    switch (status) {
      case "won":
        return "success";
      case "lost":
        return "error";
      case "proposal":
      case "negotiation":
        return "primary";
      case "qualified":
        return "warning";
      default:
        return "light";
    }
  };

  const getPriorityColor = (priority: string): "success" | "warning" | "error" | "primary" => {
    switch (priority) {
      case "urgent":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      default:
        return "success";
    }
  };

  const filteredLeads = filter === "all"
    ? leads
    : leads.filter(lead => lead.status === filter);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <p className="text-error-500">{error}</p>
        <button
          onClick={fetchLeads}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Leads
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
              {filter !== "all" && ` (${filter})`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">All Leads</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <button
              onClick={handleAddLead}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Lead
            </button>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {filter === "all" ? "No leads yet" : `No ${filter} leads`}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === "all"
                ? "Get started by adding your first lead."
                : "No leads match this filter."}
            </p>
            {filter === "all" && (
              <button
                onClick={handleAddLead}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Add Lead
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Lead
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Company
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Source
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Value
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Priority
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="py-3">
                      <div>
                        <button
                          onClick={() => handleViewLead(lead)}
                          className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                        >
                          {capitalizeName(lead.name)}
                        </button>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {lead.email || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <span className="text-gray-800 text-theme-sm dark:text-white/90">
                          {lead.company || "-"}
                        </span>
                        {lead.job_title && (
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {lead.job_title}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {lead.source ? lead.source.charAt(0).toUpperCase() + lead.source.slice(1).replace(/_/g, " ") : "-"}
                    </TableCell>
                    <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {formatValue(lead.estimated_value || 0)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={getStatusColor(lead.status)}
                      >
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        size="sm"
                        color={getPriorityColor(lead.priority)}
                      >
                        {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          disabled={deletingId === lead.id}
                          className="text-error-500 hover:text-error-600 disabled:opacity-50"
                        >
                          {deletingId === lead.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AddLeadModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleLeadSaved}
        lead={editingLead}
      />

      <LeadDetailsSidebar
        isOpen={!!viewingLead}
        onClose={() => setViewingLead(null)}
        lead={viewingLead}
        onEdit={(lead) => {
          setViewingLead(null);
          handleEditLead(lead);
        }}
        onDelete={handleDeleteLead}
      />

      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entityType="leads"
        onImportComplete={fetchLeads}
      />
    </>
  );
};
