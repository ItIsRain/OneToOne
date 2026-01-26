"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Budget } from "../BudgetsTable";

interface RecentExpense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string | null;
  status: string;
}

interface BudgetWithExpenses extends Budget {
  recent_expenses?: RecentExpense[];
}

interface BudgetDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetWithExpenses | null;
  onEdit: (budget: Budget) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (budget: Budget, newStatus: string) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
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

const departmentLabels: Record<string, string> = {
  engineering: "Engineering",
  design: "Design",
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
  hr: "Human Resources",
  legal: "Legal",
  executive: "Executive",
  other: "Other",
};

const recurrenceLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export const BudgetDetailsSidebar: React.FC<BudgetDetailsSidebarProps> = ({
  isOpen,
  onClose,
  budget,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!budget) return null;

  const status = statusConfig[budget.status] || statusConfig.draft;
  const utilization = budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0;
  const remaining = Math.max(0, budget.amount - budget.spent);

  const getUtilizationColor = (util: number): string => {
    if (util >= 100) return "text-error-500";
    if (util >= 80) return "text-warning-500";
    if (util >= 50) return "text-brand-500";
    return "text-success-500";
  };

  const getProgressBarColor = (util: number): string => {
    if (util >= 100) return "bg-error-500";
    if (util >= 80) return "bg-warning-500";
    if (util >= 50) return "bg-brand-500";
    return "bg-success-500";
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(budget.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(budget)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Edit"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </>
  );

  return (
    <DetailsSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={budget.name}
      subtitle={budget.category ? categoryLabels[budget.category] || budget.category : "Budget"}
      headerActions={headerActions}
      width="2xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
            {budget.is_recurring && (
              <Badge size="sm" color="primary">Recurring</Badge>
            )}
            {budget.rollover_enabled && (
              <Badge size="sm" color="warning">Rollover</Badge>
            )}
          </div>
          <button
            onClick={() => onEdit(budget)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Budget
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Budget Summary */}
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap">
                {formatCurrency(budget.amount, budget.currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Budget</p>
            </div>
            <div className="text-center">
              <p className={`text-xl font-bold whitespace-nowrap ${getUtilizationColor(utilization)}`}>
                {formatCurrency(budget.spent, budget.currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Spent</p>
            </div>
            <div className="text-center">
              <p className={`text-xl font-bold whitespace-nowrap ${remaining > 0 ? "text-success-500" : "text-error-500"}`}>
                {formatCurrency(remaining, budget.currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Remaining</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Utilization</span>
              <span className={`text-sm font-semibold ${getUtilizationColor(utilization)}`}>
                {utilization}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressBarColor(utilization)} transition-all`}
                style={{ width: `${Math.min(100, utilization)}%` }}
              />
            </div>
            {utilization >= budget.alert_threshold && utilization < 100 && (
              <p className="text-warning-500 text-xs mt-2">Near alert threshold ({budget.alert_threshold}%)</p>
            )}
            {utilization >= 100 && (
              <p className="text-error-500 text-xs mt-2">Budget exceeded!</p>
            )}
          </div>
        </div>

        {/* Budget Details */}
        <Section title="Details">
          <InfoRow label="Name" value={budget.name} />
          {budget.description && <InfoRow label="Description" value={budget.description} />}
          <InfoRow label="Category" value={budget.category ? categoryLabels[budget.category] || budget.category : "-"} />
          <InfoRow label="Period Type" value={periodLabels[budget.period_type] || budget.period_type} />
          {budget.department && (
            <InfoRow label="Department" value={departmentLabels[budget.department] || budget.department} />
          )}
          <InfoRow label="Currency" value={budget.currency} />
        </Section>

        {/* Date Range */}
        <Section title="Period">
          <InfoRow label="Start Date" value={formatDate(budget.start_date)} />
          <InfoRow label="End Date" value={formatDate(budget.end_date)} />
          {budget.fiscal_year && (
            <InfoRow label="Fiscal Year" value={budget.fiscal_year.toString()} />
          )}
        </Section>

        {/* Project / Client */}
        {(budget.project || budget.client) && (
          <Section title="Related To">
            {budget.project && (
              <InfoRow
                label="Project"
                value={
                  <span className="text-brand-500">
                    {budget.project.project_code ? `[${budget.project.project_code}] ` : ""}
                    {budget.project.name}
                  </span>
                }
              />
            )}
            {budget.client && (
              <InfoRow label="Client" value={budget.client.name} />
            )}
          </Section>
        )}

        {/* Alert Settings */}
        <Section title="Alert Settings">
          <InfoRow label="Alert Threshold" value={`${budget.alert_threshold}%`} />
          <InfoRow
            label="Alert Sent"
            value={
              <span className={budget.alert_sent ? "text-warning-500" : "text-gray-400"}>
                {budget.alert_sent ? "Yes" : "No"}
              </span>
            }
          />
        </Section>

        {/* Recurring Settings */}
        {budget.is_recurring && (
          <Section title="Recurring Settings">
            <div className="flex items-center gap-2 text-sm text-success-500 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recurring Budget
            </div>
            {budget.recurrence_interval && (
              <InfoRow
                label="Recurrence"
                value={recurrenceLabels[budget.recurrence_interval] || budget.recurrence_interval}
              />
            )}
          </Section>
        )}

        {/* Rollover Settings */}
        {budget.rollover_enabled && (
          <Section title="Rollover Settings">
            <div className="flex items-center gap-2 text-sm text-warning-500 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Rollover Enabled
            </div>
            <InfoRow
              label="Rollover Amount"
              value={formatCurrency(budget.rollover_amount, budget.currency)}
            />
          </Section>
        )}

        {/* Status Actions */}
        {onStatusChange && ["draft", "active", "paused"].includes(budget.status) && (
          <Section title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              {budget.status === "draft" && (
                <button
                  onClick={() => onStatusChange(budget, "active")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
                >
                  Activate Budget
                </button>
              )}
              {budget.status === "active" && (
                <>
                  <button
                    onClick={() => onStatusChange(budget, "paused")}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/20 transition-colors"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => onStatusChange(budget, "completed")}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
                  >
                    Mark Completed
                  </button>
                </>
              )}
              {budget.status === "paused" && (
                <button
                  onClick={() => onStatusChange(budget, "active")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
                >
                  Resume Budget
                </button>
              )}
            </div>
          </Section>
        )}

        {/* Recent Expenses */}
        {budget.recent_expenses && budget.recent_expenses.length > 0 && (
          <Section title="Recent Expenses">
            <div className="space-y-2">
              {budget.recent_expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(expense.amount, budget.currency)}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Notes */}
        {budget.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {budget.notes}
            </p>
          </Section>
        )}

        {/* Tags */}
        {budget.tags && budget.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {budget.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(budget.created_at)}</p>
          <p>Updated: {formatDate(budget.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default BudgetDetailsSidebar;
