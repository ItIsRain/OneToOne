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
import { CreatePaymentModal } from "./modals";
import { PaymentDetailsSidebar } from "./sidebars";

export interface Payment {
  id: string;
  invoice_id: string | null;
  client_id: string | null;
  client_name: string | null;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string | null;
  transaction_id: string | null;
  reference_number: string | null;
  status: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Related data
  client?: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
  } | null;
  invoice?: {
    id: string;
    invoice_number: string;
    total: number;
    currency: string;
    status: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  pending: { label: "Pending", color: "warning" },
  completed: { label: "Completed", color: "success" },
  failed: { label: "Failed", color: "error" },
  refunded: { label: "Refunded", color: "light" },
  cancelled: { label: "Cancelled", color: "light" },
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  check: "Check",
  paypal: "PayPal",
  stripe: "Stripe",
  other: "Other",
};

export const PaymentsTable = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payments");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch payments");
      }

      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleViewPayment = (payment: Payment) => {
    setViewingPayment(payment);
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment? This may affect the linked invoice's balance.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete payment");
      }

      setPayments(payments.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete payment");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
  };

  const handlePaymentSaved = (payment: Payment) => {
    if (editingPayment) {
      setPayments(payments.map(p => p.id === payment.id ? payment : p));
    } else {
      setPayments([payment, ...payments]);
    }
    handleModalClose();
  };

  const handleStatusChange = async (payment: Payment, newStatus: string) => {
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      setPayments(payments.map(p => p.id === payment.id ? data.payment : p));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
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

  // Filter payments
  const filteredPayments = statusFilter === "all"
    ? payments
    : payments.filter(p => p.status === statusFilter);

  // Calculate summary stats
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === "pending").length,
    completed: payments.filter(p => p.status === "completed").length,
    totalAmount: payments.filter(p => p.status === "completed").reduce((sum, p) => sum + (p.amount || 0), 0),
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
          onClick={fetchPayments}
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
              Payments
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && ` (${statusFilter})`}
              {" - "}
              <span className="font-medium text-success-500">{formatCurrency(stats.totalAmount, "USD")}</span> received
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: "All", count: stats.total },
                { key: "pending", label: "Pending", count: stats.pending },
                { key: "completed", label: "Completed", count: stats.completed },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    statusFilter === filter.key
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {filter.label} {filter.count > 0 && `(${filter.count})`}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddPayment}
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
              Record Payment
            </button>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {statusFilter === "all" ? "No payments yet" : `No ${statusFilter} payments`}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter === "all"
                ? "Start recording payments received."
                : "Try changing the filter to see other payments."}
            </p>
            {statusFilter === "all" && (
              <button
                onClick={handleAddPayment}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Record Payment
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
                    Client / Invoice
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
                    Method
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Date
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
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredPayments.map((payment) => {
                  const status = statusConfig[payment.status] || statusConfig.pending;

                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="py-3">
                        <div>
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                          >
                            {payment.client?.name || payment.client_name || "Unknown"}
                          </button>
                          {payment.invoice && (
                            <span className="block text-brand-500 text-theme-xs">
                              {payment.invoice.invoice_number}
                            </span>
                          )}
                          {payment.reference_number && (
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              Ref: {payment.reference_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-600 text-theme-sm dark:text-gray-300">
                          {payment.payment_method ? paymentMethodLabels[payment.payment_method] || payment.payment_method : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-500 dark:text-gray-400 text-theme-sm">
                          {formatDate(payment.payment_date)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative group">
                          <Badge size="sm" color={status.color}>
                            {status.label}
                          </Badge>
                          {/* Quick status change dropdown */}
                          {payment.status === "pending" && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                                <button
                                  onClick={() => handleStatusChange(payment, "completed")}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-success-500"
                                >
                                  Mark Completed
                                </button>
                                <button
                                  onClick={() => handleStatusChange(payment, "failed")}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-error-500"
                                >
                                  Mark Failed
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditPayment(payment)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-theme-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            disabled={deletingId === payment.id}
                            className="text-error-500 hover:text-error-600 disabled:opacity-50 text-theme-sm font-medium"
                          >
                            {deletingId === payment.id ? "..." : "Delete"}
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

      <CreatePaymentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handlePaymentSaved}
        payment={editingPayment}
      />

      <PaymentDetailsSidebar
        isOpen={!!viewingPayment}
        onClose={() => setViewingPayment(null)}
        payment={viewingPayment}
        onEdit={(payment) => {
          setViewingPayment(null);
          handleEditPayment(payment);
        }}
        onDelete={handleDeletePayment}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};
