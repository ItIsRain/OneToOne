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
import { CreateBudgetModal } from "./modals";
import { BudgetDetailsSidebar } from "./sidebars";

export interface Budget {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  spent: number;
  currency: string;
  period_type: "monthly" | "quarterly" | "yearly" | "project" | "custom";
  start_date: string;
  end_date: string | null;
  category: string | null;
  project_id: string | null;
  client_id: string | null;
  department: string | null;
  alert_threshold: number;
  alert_sent: boolean;
  status: "draft" | "active" | "paused" | "completed" | "exceeded";
  notes: string | null;
  tags: string[] | null;
  rollover_enabled: boolean;
  rollover_amount: number;
  fiscal_year: number | null;
  is_recurring: boolean;
  recurrence_interval: string | null;
  created_at: string;
  updated_at: string;
  // Related data
  project?: {
    id: string;
    name: string;
    project_code: string | null;
  } | null;
  client?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  active: { label: "Active", color: "success" },
  paused: { label: "Paused", color: "warning" },
  completed: { label: "Completed", color: "primary" },
  exceeded: { label: "Exceeded", color: "error" },
};

const categoryLabels: Record<string, string> = {
  marketing: "Marketing",
  operations: "Operations",
  payroll: "Payroll",
  travel: "Travel",
  equipment: "Equipment",
  software: "Software",
  contractors: "Contractors",
  events: "Events",
  general: "General",
  other: "Other",
};

const periodLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  project: "Project",
  custom: "Custom",
};

export const BudgetsTable = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/budgets");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch budgets");
      }

      setBudgets(data.budgets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleViewBudget = async (budget: Budget) => {
    try {
      const res = await fetch(`/api/budgets/${budget.id}`);
      const data = await res.json();
      if (res.ok) {
        setViewingBudget(data.budget);
      } else {
        setViewingBudget(budget);
      }
    } catch {
      setViewingBudget(budget);
    }
  };

  const handleAddBudget = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete budget");
      }

      setBudgets(budgets.filter(b => b.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete budget");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleBudgetSaved = (budget: Budget) => {
    if (editingBudget) {
      setBudgets(budgets.map(b => b.id === budget.id ? budget : b));
    } else {
      setBudgets([budget, ...budgets]);
    }
    handleModalClose();
  };

  const handleStatusChange = async (budget: Budget, newStatus: string) => {
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      setBudgets(budgets.map(b => b.id === budget.id ? data.budget : b));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const getUtilization = (budget: Budget): number => {
    if (!budget.amount || budget.amount === 0) return 0;
    return Math.round((budget.spent / budget.amount) * 100);
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization >= 100) return "text-error-500";
    if (utilization >= 80) return "text-warning-500";
    if (utilization >= 50) return "text-brand-500";
    return "text-success-500";
  };

  const getProgressBarColor = (utilization: number): string => {
    if (utilization >= 100) return "bg-error-500";
    if (utilization >= 80) return "bg-warning-500";
    if (utilization >= 50) return "bg-brand-500";
    return "bg-success-500";
  };

  // Filter budgets
  const filteredBudgets = statusFilter === "all"
    ? budgets
    : budgets.filter(b => b.status === statusFilter);

  // Calculate summary stats
  const stats = {
    total: budgets.length,
    active: budgets.filter(b => b.status === "active").length,
    exceeded: budgets.filter(b => b.status === "exceeded").length,
    totalBudget: budgets.filter(b => b.status === "active").reduce((sum, b) => sum + (b.amount || 0), 0),
    totalSpent: budgets.filter(b => b.status === "active").reduce((sum, b) => sum + (b.spent || 0), 0),
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
          onClick={fetchBudgets}
          className="mt-2 text-brand-500 hover:text-brand-600"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">
            {formatCurrency(stats.totalBudget)}
          </h3>
          <p className="text-xs text-gray-400 mt-1">{stats.active} active budgets</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
          <h3 className="text-2xl font-bold text-warning-500 mt-1">
            {formatCurrency(stats.totalSpent)}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0}% utilized
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
          <h3 className="text-2xl font-bold text-success-500 mt-1">
            {formatCurrency(Math.max(0, stats.totalBudget - stats.totalSpent))}
          </h3>
          <p className="text-xs text-gray-400 mt-1">available to spend</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Exceeded</p>
          <h3 className={`text-2xl font-bold mt-1 ${stats.exceeded > 0 ? "text-error-500" : "text-gray-400"}`}>
            {stats.exceeded}
          </h3>
          <p className="text-xs text-gray-400 mt-1">budgets over limit</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Budgets
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredBudgets.length} budget{filteredBudgets.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && ` (${statusFilter})`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: "All", count: stats.total },
                { key: "active", label: "Active", count: stats.active },
                { key: "exceeded", label: "Exceeded", count: stats.exceeded },
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
              onClick={handleAddBudget}
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
              Create Budget
            </button>
          </div>
        </div>

        {filteredBudgets.length === 0 ? (
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
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {statusFilter === "all" ? "No budgets yet" : `No ${statusFilter} budgets`}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter === "all"
                ? "Create budgets to track and manage spending."
                : "Try changing the filter to see other budgets."}
            </p>
            {statusFilter === "all" && (
              <button
                onClick={handleAddBudget}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Create Budget
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
                    Budget
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
                    Period
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Spent / Budget
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Utilization
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
                {filteredBudgets.map((budget) => {
                  const status = statusConfig[budget.status] || statusConfig.draft;
                  const utilization = getUtilization(budget);

                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="py-3">
                        <div>
                          <button
                            onClick={() => handleViewBudget(budget)}
                            className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400 text-left"
                          >
                            {budget.name}
                          </button>
                          {budget.project && (
                            <span className="block text-brand-500 text-theme-xs">
                              {budget.project.name}
                            </span>
                          )}
                          {budget.department && (
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {budget.department}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-gray-600 text-theme-sm dark:text-gray-300">
                          {budget.category ? categoryLabels[budget.category] || budget.category : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div>
                          <span className="text-gray-600 text-theme-sm dark:text-gray-300">
                            {periodLabels[budget.period_type] || budget.period_type}
                          </span>
                          <span className="block text-gray-400 text-theme-xs">
                            {formatDate(budget.start_date)}
                            {budget.end_date && ` - ${formatDate(budget.end_date)}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div>
                          <span className={`font-medium text-theme-sm ${getUtilizationColor(utilization)}`}>
                            {formatCurrency(budget.spent, budget.currency)}
                          </span>
                          <span className="text-gray-500 text-theme-sm"> / </span>
                          <span className="text-gray-700 dark:text-gray-300 text-theme-sm">
                            {formatCurrency(budget.amount, budget.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="w-24">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getProgressBarColor(utilization)} transition-all`}
                                style={{ width: `${Math.min(100, utilization)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${getUtilizationColor(utilization)}`}>
                              {utilization}%
                            </span>
                          </div>
                          {utilization >= budget.alert_threshold && utilization < 100 && (
                            <span className="text-warning-500 text-xs">Near limit</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative group">
                          <Badge size="sm" color={status.color}>
                            {status.label}
                          </Badge>
                          {/* Quick status change dropdown */}
                          {["draft", "active", "paused"].includes(budget.status) && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                                {budget.status === "draft" && (
                                  <button
                                    onClick={() => handleStatusChange(budget, "active")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-success-500"
                                  >
                                    Activate
                                  </button>
                                )}
                                {budget.status === "active" && (
                                  <>
                                    <button
                                      onClick={() => handleStatusChange(budget, "paused")}
                                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-warning-500"
                                    >
                                      Pause
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(budget, "completed")}
                                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-brand-500"
                                    >
                                      Complete
                                    </button>
                                  </>
                                )}
                                {budget.status === "paused" && (
                                  <button
                                    onClick={() => handleStatusChange(budget, "active")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-success-500"
                                  >
                                    Resume
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewBudget(budget)}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-theme-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            disabled={deletingId === budget.id}
                            className="text-error-500 hover:text-error-600 disabled:opacity-50 text-theme-sm font-medium"
                          >
                            {deletingId === budget.id ? "..." : "Delete"}
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

      <CreateBudgetModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleBudgetSaved}
        budget={editingBudget}
      />

      <BudgetDetailsSidebar
        isOpen={!!viewingBudget}
        onClose={() => setViewingBudget(null)}
        budget={viewingBudget}
        onEdit={(budget) => {
          setViewingBudget(null);
          handleEditBudget(budget);
        }}
        onDelete={handleDeleteBudget}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};
