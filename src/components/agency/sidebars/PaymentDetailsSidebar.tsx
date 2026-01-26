"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Payment } from "../PaymentsTable";

interface PaymentDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onEdit: (payment: Payment) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (payment: Payment, newStatus: string) => void;
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

export const PaymentDetailsSidebar: React.FC<PaymentDetailsSidebarProps> = ({
  isOpen,
  onClose,
  payment,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!payment) return null;

  const status = statusConfig[payment.status] || statusConfig.pending;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this payment? This may affect the linked invoice's balance.")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(payment.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(payment)}
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
      title={formatCurrency(payment.amount, payment.currency)}
      subtitle={payment.client?.name || payment.client_name || "Payment"}
      headerActions={headerActions}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <Badge size="sm" color={status.color}>
            {status.label}
          </Badge>
          <button
            onClick={() => onEdit(payment)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Payment
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Payment Summary */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={2}>
            <StatItem
              label="Amount"
              value={formatCurrency(payment.amount, payment.currency)}
              color="text-success-500"
            />
            <StatItem
              label="Date"
              value={formatDate(payment.payment_date)}
            />
          </StatsGrid>
        </div>

        {/* Payment Details */}
        <Section title="Payment Details">
          <InfoRow label="Payment Method" value={payment.payment_method ? paymentMethodLabels[payment.payment_method] || payment.payment_method : "-"} />
          <InfoRow label="Status" value={
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
          } />
          {payment.transaction_id && <InfoRow label="Transaction ID" value={payment.transaction_id} />}
          {payment.reference_number && <InfoRow label="Reference #" value={payment.reference_number} />}
        </Section>

        {/* Client Information */}
        <Section title="Client">
          <InfoRow
            label="Name"
            value={payment.client?.name || payment.client_name || "-"}
          />
          {payment.client?.company && (
            <InfoRow label="Company" value={payment.client.company} />
          )}
          {payment.client?.email && (
            <InfoRow
              label="Email"
              value={
                <a
                  href={`mailto:${payment.client.email}`}
                  className="text-brand-500 hover:text-brand-600"
                >
                  {payment.client.email}
                </a>
              }
            />
          )}
        </Section>

        {/* Linked Invoice */}
        {payment.invoice && (
          <Section title="Linked Invoice">
            <InfoRow label="Invoice #" value={
              <span className="text-brand-500 font-medium">
                {payment.invoice.invoice_number}
              </span>
            } />
            <InfoRow label="Invoice Total" value={formatCurrency(payment.invoice.total, payment.invoice.currency)} />
            <InfoRow label="Invoice Status" value={
              <Badge size="sm" color={payment.invoice.status === "paid" ? "success" : "warning"}>
                {payment.invoice.status.replace("_", " ")}
              </Badge>
            } />
          </Section>
        )}

        {/* Status Actions */}
        {onStatusChange && payment.status === "pending" && (
          <Section title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onStatusChange(payment, "completed")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
              >
                Mark Completed
              </button>
              <button
                onClick={() => onStatusChange(payment, "failed")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 transition-colors"
              >
                Mark Failed
              </button>
            </div>
          </Section>
        )}

        {onStatusChange && payment.status === "completed" && (
          <Section title="Quick Actions">
            <button
              onClick={() => onStatusChange(payment, "refunded")}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              Mark as Refunded
            </button>
          </Section>
        )}

        {/* Notes */}
        {payment.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {payment.notes}
            </p>
          </Section>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Created: {formatDate(payment.created_at)}</p>
          <p>Updated: {formatDate(payment.updated_at)}</p>
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default PaymentDetailsSidebar;
