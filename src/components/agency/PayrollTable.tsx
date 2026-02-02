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
import { RunPayrollModal } from "./modals";
import { PayrollDetailsSidebar } from "./sidebars";

export interface PayrollItem {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  base_salary: number;
  hourly_rate: number;
  hours_worked: number;
  overtime_hours: number;
  overtime_rate: number;
  regular_pay: number;
  overtime_pay: number;
  bonus: number;
  commission: number;
  allowances: number;
  reimbursements: number;
  gross_pay: number;
  tax_federal: number;
  tax_state: number;
  tax_local: number;
  social_security: number;
  medicare: number;
  health_insurance: number;
  dental_insurance: number;
  vision_insurance: number;
  retirement_401k: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  payment_method: string;
  status: "pending" | "paid" | "failed";
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
    job_title: string | null;
    department: string | null;
  } | null;
}

export interface PayrollRun {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  pay_date: string | null;
  run_number: string;
  name: string;
  status: "draft" | "pending_approval" | "approved" | "processing" | "completed" | "cancelled";
  total_gross: number;
  total_deductions: number;
  total_net: number;
  notes: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  employee_count?: number;
  items?: PayrollItem[];
  created_by_user?: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  approved_by_user?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
  } | null;
  processed_by_user?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "error" | "primary" | "light" }> = {
  draft: { label: "Draft", color: "light" },
  pending_approval: { label: "Pending Approval", color: "warning" },
  approved: { label: "Approved", color: "primary" },
  processing: { label: "Processing", color: "warning" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

export const PayrollTable = () => {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRun, setViewingRun] = useState<PayrollRun | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalRuns: 0,
    yearToDatePayout: 0,
    pendingApproval: 0,
    draft: 0,
  });

  const fetchPayrollRuns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team/payroll");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch payroll runs");
      }

      setPayrollRuns(data.payrollRuns || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payroll runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns]);

  const handleViewRun = async (run: PayrollRun) => {
    try {
      const res = await fetch(`/api/team/payroll/${run.id}`);
      const data = await res.json();
      if (res.ok) {
        setViewingRun(data.payrollRun);
      } else {
        setViewingRun(run);
      }
    } catch {
      setViewingRun(run);
    }
  };

  const handleAddRun = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleRunSaved = (run: PayrollRun) => {
    setPayrollRuns([run, ...payrollRuns]);
    handleModalClose();
    fetchPayrollRuns();
  };

  const handleStatusChange = async (run: PayrollRun, newStatus: string) => {
    try {
      const res = await fetch(`/api/team/payroll/${run.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      const data = await res.json();
      setPayrollRuns(payrollRuns.map((r) => (r.id === run.id ? data.payrollRun : r)));

      // Update viewing run if it's the same one
      if (viewingRun?.id === run.id) {
        // Refetch full details
        const detailsRes = await fetch(`/api/team/payroll/${run.id}`);
        const detailsData = await detailsRes.json();
        if (detailsRes.ok) {
          setViewingRun(detailsData.payrollRun);
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteRun = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payroll run?")) {
      return;
    }

    try {
      const res = await fetch(`/api/team/payroll/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete payroll run");
      }

      setPayrollRuns(payrollRuns.filter((r) => r.id !== id));
      setViewingRun(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete payroll run");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD"): string => {
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

  const formatPeriod = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  // Filter runs
  const filteredRuns =
    statusFilter === "all"
      ? payrollRuns
      : payrollRuns.filter((r) => r.status === statusFilter);

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
          onClick={fetchPayrollRuns}
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Runs</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">
            {stats.totalRuns}
          </h3>
          <p className="text-xs text-gray-400 mt-1">all time</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Year-to-Date</p>
          <h3 className="text-2xl font-bold text-success-500 mt-1">
            {formatCurrency(stats.yearToDatePayout)}
          </h3>
          <p className="text-xs text-gray-400 mt-1">total payout</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</p>
          <h3 className={`text-2xl font-bold mt-1 ${stats.pendingApproval > 0 ? "text-warning-500" : "text-gray-400"}`}>
            {stats.pendingApproval}
          </h3>
          <p className="text-xs text-gray-400 mt-1">runs</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Draft</p>
          <h3 className={`text-2xl font-bold mt-1 ${stats.draft > 0 ? "text-brand-500" : "text-gray-400"}`}>
            {stats.draft}
          </h3>
          <p className="text-xs text-gray-400 mt-1">runs</p>
        </div>
      </div>

      {/* Payroll Runs Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Payroll Runs
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredRuns.length} {filteredRuns.length === 1 ? "run" : "runs"}
              {statusFilter !== "all" && ` (${statusConfig[statusFilter]?.label || statusFilter})`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { key: "all", label: "All" },
                { key: "draft", label: "Draft" },
                { key: "pending_approval", label: "Pending" },
                { key: "completed", label: "Completed" },
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
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleAddRun}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Run Payroll
            </button>
          </div>
        </div>

        {filteredRuns.length === 0 ? (
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No payroll runs yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start processing payroll for your team.
            </p>
            <button
              onClick={handleAddRun}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Run Payroll
            </button>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Run #
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Pay Period
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Employees
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Total Net
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRuns.map((run) => {
                  const status = statusConfig[run.status] || statusConfig.draft;

                  return (
                    <TableRow key={run.id}>
                      <TableCell className="py-3 px-4">
                        <div>
                          <button
                            onClick={() => handleViewRun(run)}
                            className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 hover:text-brand-500 dark:hover:text-brand-400"
                          >
                            {run.run_number}
                          </button>
                          <p className="text-xs text-gray-500">{run.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div>
                          <span className="text-gray-800 text-theme-sm dark:text-white/90">
                            {formatPeriod(run.period_start, run.period_end)}
                          </span>
                          {run.pay_date && (
                            <p className="text-xs text-gray-500">
                              Pay date: {formatDate(run.pay_date)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span className="text-gray-800 text-theme-sm dark:text-white/90">
                          {run.employee_count || 0}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                            {formatCurrency(run.total_net)}
                          </span>
                          <p className="text-xs text-gray-500">
                            Gross: {formatCurrency(run.total_gross)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="relative group">
                          <Badge size="sm" color={status.color}>
                            {status.label}
                          </Badge>
                          {/* Quick status change dropdown */}
                          {["draft", "pending_approval", "approved"].includes(run.status) && (
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]">
                                {run.status === "draft" && (
                                  <button
                                    onClick={() => handleStatusChange(run, "pending_approval")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-brand-500"
                                  >
                                    Submit for Approval
                                  </button>
                                )}
                                {run.status === "pending_approval" && (
                                  <>
                                    <button
                                      onClick={() => handleStatusChange(run, "approved")}
                                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-success-500"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(run, "draft")}
                                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                    >
                                      Return to Draft
                                    </button>
                                  </>
                                )}
                                {run.status === "approved" && (
                                  <button
                                    onClick={() => handleStatusChange(run, "processing")}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-warning-500"
                                  >
                                    Start Processing
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewRun(run)}
                            className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-theme-sm font-medium"
                          >
                            View
                          </button>
                          {run.status === "processing" && (
                            <button
                              onClick={() => handleStatusChange(run, "completed")}
                              className="text-success-500 hover:text-success-600 text-theme-sm font-medium"
                            >
                              Complete
                            </button>
                          )}
                          {run.status === "draft" && (
                            <button
                              onClick={() => handleDeleteRun(run.id)}
                              className="text-error-500 hover:text-error-600 text-theme-sm font-medium"
                            >
                              Delete
                            </button>
                          )}
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

      <RunPayrollModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleRunSaved}
      />

      <PayrollDetailsSidebar
        isOpen={!!viewingRun}
        onClose={() => setViewingRun(null)}
        payrollRun={viewingRun}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteRun}
      />
    </>
  );
};
