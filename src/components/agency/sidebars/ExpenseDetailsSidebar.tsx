"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Expense } from "../ExpensesTable";

interface ExpenseDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onEdit: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (expense: Expense, newStatus: string) => void;
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

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  check: "Check",
  company_card: "Company Card",
  petty_cash: "Petty Cash",
  paypal: "PayPal",
  other: "Other",
};

export const ExpenseDetailsSidebar: React.FC<ExpenseDetailsSidebarProps> = ({
  isOpen,
  onClose,
  expense,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!expense) return null;

  const status = statusConfig[expense.status] || statusConfig.pending;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(expense.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(expense)}
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
      title={expense.description}
      subtitle={expense.category ? categoryLabels[expense.category] || expense.category : "Expense"}
      headerActions={headerActions}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
            {expense.is_billable && (
              <Badge size="sm" color="success">Billable</Badge>
            )}
            {expense.is_reimbursable && (
              <Badge size="sm" color="warning">Reimbursable</Badge>
            )}
          </div>
          <button
            onClick={() => onEdit(expense)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Expense
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Amount Summary */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={2}>
            <StatItem
              label="Amount"
              value={formatCurrency(expense.amount, expense.currency)}
            />
            <StatItem
              label="Date"
              value={formatDate(expense.expense_date)}
            />
          </StatsGrid>
        </div>

        {/* Expense Details */}
        <Section title="Details">
          <InfoRow label="Description" value={expense.description} />
          <InfoRow label="Category" value={expense.category ? categoryLabels[expense.category] || expense.category : "-"} />
          <InfoRow label="Payment Method" value={expense.payment_method ? paymentMethodLabels[expense.payment_method] || expense.payment_method : "-"} />
          {expense.vendor_name && <InfoRow label="Vendor" value={expense.vendor_name} />}
          {expense.receipt_number && <InfoRow label="Receipt #" value={expense.receipt_number} />}
        </Section>

        {/* Project / Client */}
        {(expense.project || expense.client) && (
          <Section title="Related To">
            {expense.project && (
              <InfoRow
                label="Project"
                value={
                  <span className="text-brand-500">
                    {expense.project.project_code ? `[${expense.project.project_code}] ` : ""}
                    {expense.project.name}
                  </span>
                }
              />
            )}
            {expense.client && (
              <InfoRow label="Client" value={expense.client.name} />
            )}
          </Section>
        )}

        {/* Flags */}
        <Section title="Properties">
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 text-sm ${expense.is_billable ? "text-success-500" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {expense.is_billable ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              Billable
            </div>
            <div className={`flex items-center gap-2 text-sm ${expense.is_reimbursable ? "text-warning-500" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {expense.is_reimbursable ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              Reimbursable
            </div>
            <div className={`flex items-center gap-2 text-sm ${expense.tax_deductible ? "text-brand-500" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {expense.tax_deductible ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              Tax Deductible
            </div>
          </div>
        </Section>

        {/* Status Actions */}
        {onStatusChange && expense.status === "pending" && (
          <Section title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onStatusChange(expense, "approved")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onStatusChange(expense, "rejected")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 transition-colors"
              >
                Reject
              </button>
            </div>
          </Section>
        )}

        {expense.is_reimbursable && expense.status === "approved" && onStatusChange && (
          <Section title="Reimbursement">
            <button
              onClick={() => onStatusChange(expense, "reimbursed")}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
            >
              Mark as Reimbursed
            </button>
          </Section>
        )}

        {/* Receipt */}
        {expense.receipt_url && (
          <Section title="Receipt">
            <a
              href={expense.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Receipt
            </a>
          </Section>
        )}

        {/* Notes */}
        {expense.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {expense.notes}
            </p>
          </Section>
        )}

        {/* Tax Information */}
        {expense.tax_category && (
          <Section title="Tax Information">
            <InfoRow label="Tax Category" value={expense.tax_category} />
          </Section>
        )}

        {/* Tags */}
        {expense.tags && expense.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {expense.tags.map((tag, index) => (
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
          <p>Created: {formatDate(expense.created_at)}</p>
          <p>Updated: {formatDate(expense.updated_at)}</p>
          {expense.approved_at && <p>Approved: {formatDate(expense.approved_at)}</p>}
          {expense.reimbursed_at && <p>Reimbursed: {formatDate(expense.reimbursed_at)}</p>}
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default ExpenseDetailsSidebar;
