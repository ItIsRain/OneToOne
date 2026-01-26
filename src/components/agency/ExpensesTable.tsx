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
import { CreateExpenseModal } from "./modals";
import { ExpenseDetailsSidebar } from "./sidebars";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  category: string | null;
  project_id: string | null;
  event_id: string | null;
  client_id: string | null;
  vendor_name: string | null;
  payment_method: string | null;
  is_reimbursable: boolean;
  is_billable: boolean;
  reimbursed_at: string | null;
  receipt_url: string | null;
  receipt_number: string | null;
  status: "pending" | "approved" | "rejected" | "reimbursed";
  approved_by: string | null;
  approved_at: string | null;
  tax_deductible: boolean;
  tax_category: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // Related data
  client?: {
    id: string;
    name: string;
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
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  pending: { label: "Pending", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  reimbursed: { label: "Reimbursed", color: "primary" },
};

const categoryLabels: Record<string, string> = {
  travel: "Travel",
  supplies: "Office Supplies",
  equipment: "Equipment",
  software: "Software",
  marketing: "Marketing",
  meals: "Meals & Entertainment",
  utilities: "Utilities",
  rent: "Rent",
  salaries: "Salaries",
  contractors: "Contractors",
  insurance: "Insurance",
  taxes: "Taxes",
  entertainment: "Entertainment",
  professional_services: "Professional Services",
  other: "Other",
};

export const ExpensesTable = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/expenses");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch expenses");
      }

      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense);
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete expense");
      }

      setExpenses(expenses.filter(e => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleExpenseSaved = (expense: Expense) => {
    if (editingExpense) {
      setExpenses(expenses.map(e => e.id === expense.id ? expense : e));
    } else {
      setExpenses([expense, ...expenses]);
    }
    handleModalClose();
  };

  const handleStatusChange = async (expense: Expense, newStatus: string) => {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      setExpenses(expenses.map(e => e.id === expense.id ? data.expense : e));
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

  // Filter expenses
  let filteredExpenses = expenses;
  if (statusFilter !== "all") {
    filteredExpenses = filteredExpenses.filter(e => e.status === statusFilter);
  }
  if (categoryFilter !== "all") {
    filteredExpenses = filteredExpenses.filter(e => e.category === categoryFilter);
  }

  // Calculate summary stats
  const stats = {
    total: expenses.length,
    pending: expenses.filter(e => e.status === "pending").length,
    approved: expenses.filter(e => e.status === "approved").length,
    totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
  };

  // Get unique categories
  const categories = [...new Set(expenses.map(e => e.category).filter(Boolean))];

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
          onClick={fetchExpenses}
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
              Expenses
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && ` (${statusFilter})`}
              {" - "}
              <span className="font-medium">{formatCurrency(stats.totalAmount, "USD")}</span> total
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: "All", count: stats.total },
                { key: "pending", label: "Pending", count: stats.pending },
                { key: "approved", label: "Approved", count: stats.approved },
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

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat || ""}>
                    {categoryLabels[cat || ""] || cat}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleAddExpense}
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
              Add Expense
            </button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {statusFilter === "all" ? "No expenses yet" : `No ${statusFilter} expenses`}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter === "all"
                ? "Start tracking your expenses."
                : "Try changing the filter to see other expenses."}
            </p>
            {statusFilter === "all" && (
              <button
                onClick={handleAddExpense}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Add Expense
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
                    Description
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Category
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
                {filteredExpenses.map((expense) => {
                  const status = statusConfig[expense.status] || statusConfig.pending;

                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="py-3">
                        <div>
                          <button
                            onClick={() => handleViewExpense(expense)}
                            className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                          >
                            {expense.description}
                          </button>
                          {expense.vendor_name && (
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {expense.vendor_name}
                            </span>
                          )}
                          {expense.project && (
                            <span className="block text-brand-500 text-theme-xs">
                              {expense.project.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-600 text-theme-sm dark:text-gray-300">
                          {expense.category ? categoryLabels[expense.category] || expense.category : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                        {expense.is_billable && (
                          <span className="text-success-500 text-theme-xs">Billable</span>
                        )}
                        {expense.is_reimbursable && (
                          <span className="text-warning-500 text-theme-xs ml-2">Reimbursable</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-500 dark:text-gray-400 text-theme-sm">
                          {formatDate(expense.expense_date)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative group">
                          <Badge size="sm" color={status.color}>
                            {status.label}
                          </Badge>
                          {/* Quick status change dropdown */}
                          {expense.status === "pending" && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                                <button
                                  onClick={() => handleStatusChange(expense, "approved")}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-success-500"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(expense, "rejected")}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-error-500"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewExpense(expense)}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-theme-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={deletingId === expense.id}
                            className="text-error-500 hover:text-error-600 disabled:opacity-50 text-theme-sm font-medium"
                          >
                            {deletingId === expense.id ? "..." : "Delete"}
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

      <CreateExpenseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleExpenseSaved}
        expense={editingExpense}
      />

      <ExpenseDetailsSidebar
        isOpen={!!viewingExpense}
        onClose={() => setViewingExpense(null)}
        expense={viewingExpense}
        onEdit={(expense) => {
          setViewingExpense(null);
          handleEditExpense(expense);
        }}
        onDelete={handleDeleteExpense}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};
