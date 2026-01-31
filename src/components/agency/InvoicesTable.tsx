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
import { CreateInvoiceModal } from "./modals";
import { InvoiceDetailsSidebar } from "./sidebars";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
  amount: number;
  discount_type: string;
  discount_value: number;
  tax_rate: number;
  sort_order: number;
  notes: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  title: string | null;
  client_id: string | null;
  project_id: string | null;
  event_id: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  total: number;
  amount: number;
  amount_paid: number;
  currency: string;
  status: "draft" | "sent" | "viewed" | "paid" | "partially_paid" | "overdue" | "cancelled" | "refunded";
  issue_date: string;
  due_date: string | null;
  sent_date: string | null;
  paid_at: string | null;
  payment_terms: string;
  notes: string | null;
  terms_and_conditions: string | null;
  footer_note: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_country: string | null;
  po_number: string | null;
  reference_number: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // Related data
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
  event?: {
    id: string;
    title: string;
  } | null;
  items?: InvoiceItem[];
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  sent: { label: "Sent", color: "primary" },
  viewed: { label: "Viewed", color: "primary" },
  paid: { label: "Paid", color: "success" },
  partially_paid: { label: "Partial", color: "warning" },
  overdue: { label: "Overdue", color: "error" },
  cancelled: { label: "Cancelled", color: "light" },
  refunded: { label: "Refunded", color: "light" },
};

export const InvoicesTable = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/invoices");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch invoices");
      }

      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleViewInvoice = async (invoice: Invoice) => {
    // Fetch full invoice details with items
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`);
      const data = await res.json();
      if (res.ok) {
        setViewingInvoice(data.invoice);
      } else {
        setViewingInvoice(invoice);
      }
    } catch {
      setViewingInvoice(invoice);
    }
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete invoice");
      }

      setInvoices(invoices.filter(i => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const handleInvoiceSaved = (invoice: Invoice) => {
    if (editingInvoice) {
      setInvoices(invoices.map(i => i.id === invoice.id ? invoice : i));
    } else {
      setInvoices([invoice, ...invoices]);
    }
    handleModalClose();
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      setInvoices(invoices.map(i => i.id === invoice.id ? data.invoice : i));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBalanceDue = (invoice: Invoice): number => {
    const total = invoice.total || invoice.amount || 0;
    const paid = invoice.amount_paid || 0;
    return total - paid;
  };

  // Filter invoices
  const filteredInvoices = statusFilter === "all"
    ? invoices
    : invoices.filter(i => i.status === statusFilter);

  // Calculate summary stats
  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === "draft").length,
    pending: invoices.filter(i => ["sent", "viewed"].includes(i.status)).length,
    paid: invoices.filter(i => i.status === "paid").length,
    overdue: invoices.filter(i => i.status === "overdue").length,
  };

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
          onClick={fetchInvoices}
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
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Invoices
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && ` (${statusFilter})`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: "All", count: stats.total },
                { key: "draft", label: "Draft", count: stats.draft },
                { key: "sent", label: "Pending", count: stats.pending },
                { key: "paid", label: "Paid", count: stats.paid },
                { key: "overdue", label: "Overdue", count: stats.overdue },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key === "sent" ? "sent" : filter.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    statusFilter === filter.key || (filter.key === "sent" && statusFilter === "sent")
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {filter.label} {filter.count > 0 && `(${filter.count})`}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddInvoice}
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
              Create Invoice
            </button>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {statusFilter === "all" ? "No invoices yet" : `No ${statusFilter} invoices`}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter === "all"
                ? "Get started by creating your first invoice."
                : "Try changing the filter to see other invoices."}
            </p>
            {statusFilter === "all" && (
              <button
                onClick={handleAddInvoice}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Create Invoice
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
                    Invoice
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Client
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Amount
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
                    Due Date
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
                {filteredInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status] || statusConfig.draft;
                  const balanceDue = getBalanceDue(invoice);

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="py-3">
                        <div>
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                          >
                            {invoice.invoice_number}
                          </button>
                          {invoice.title && (
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {invoice.title}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-gray-800 text-theme-sm dark:text-white/90">
                          {invoice.client?.name || invoice.billing_name || "-"}
                        </div>
                        {invoice.client?.company && (
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {invoice.client.company}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {formatCurrency(invoice.total || invoice.amount, invoice.currency)}
                        </div>
                        {invoice.status === "partially_paid" && balanceDue > 0 && (
                          <span className="block text-warning-500 text-theme-xs">
                            {formatCurrency(balanceDue, invoice.currency)} due
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative group">
                          <Badge size="sm" color={status.color}>
                            {status.label}
                          </Badge>
                          {/* Quick status change dropdown */}
                          {["draft", "sent", "overdue", "partially_paid"].includes(invoice.status) && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                                {invoice.status === "draft" && (
                                  <button
                                    onClick={() => handleStatusChange(invoice, "sent")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    Mark as Sent
                                  </button>
                                )}
                                {["sent", "overdue", "partially_paid"].includes(invoice.status) && (
                                  <button
                                    onClick={() => handleStatusChange(invoice, "paid")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-success-500"
                                  >
                                    Mark as Paid
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className={`text-theme-sm ${
                          invoice.status === "overdue"
                            ? "text-error-500 font-medium"
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {formatDate(invoice.due_date)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditInvoice(invoice)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-theme-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            disabled={deletingId === invoice.id}
                            className="text-error-500 hover:text-error-600 disabled:opacity-50 text-theme-sm font-medium"
                          >
                            {deletingId === invoice.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleInvoiceSaved}
        invoice={editingInvoice}
      />

      <InvoiceDetailsSidebar
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        invoice={viewingInvoice}
        onEdit={(invoice) => {
          setViewingInvoice(null);
          handleEditInvoice(invoice);
        }}
        onDelete={handleDeleteInvoice}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};
