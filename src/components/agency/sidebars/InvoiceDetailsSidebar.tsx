"use client";
import React, { useState } from "react";
import { DetailsSidebar, InfoRow, Section, StatsGrid, StatItem } from "@/components/ui/DetailsSidebar";
import Badge from "@/components/ui/badge/Badge";
import type { Invoice } from "../InvoicesTable";

interface InvoiceDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onEdit: (invoice: Invoice) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (invoice: Invoice, newStatus: string) => void;
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
  sent: { label: "Sent", color: "primary" },
  viewed: { label: "Viewed", color: "primary" },
  paid: { label: "Paid", color: "success" },
  partially_paid: { label: "Partially Paid", color: "warning" },
  overdue: { label: "Overdue", color: "error" },
  cancelled: { label: "Cancelled", color: "light" },
  refunded: { label: "Refunded", color: "light" },
};

export const InvoiceDetailsSidebar: React.FC<InvoiceDetailsSidebarProps> = ({
  isOpen,
  onClose,
  invoice,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!invoice) return null;

  const status = statusConfig[invoice.status] || statusConfig.draft;
  const balanceDue = (invoice.total || invoice.amount || 0) - (invoice.amount_paid || 0);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        onDelete(invoice.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const headerActions = (
    <>
      <button
        onClick={() => onEdit(invoice)}
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
      title={invoice.invoice_number}
      subtitle={invoice.title || invoice.client?.name || "Invoice"}
      headerActions={headerActions}
      width="xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
            {invoice.status !== "paid" && invoice.status !== "cancelled" && onStatusChange && (
              <button
                onClick={() => onStatusChange(invoice, "paid")}
                className="text-xs text-success-500 hover:text-success-600 font-medium"
              >
                Mark Paid
              </button>
            )}
          </div>
          <button
            onClick={() => onEdit(invoice)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Edit Invoice
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Financial Summary */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <StatsGrid columns={3}>
            <StatItem
              label="Total"
              value={formatCurrency(invoice.total || invoice.amount, invoice.currency)}
            />
            <StatItem
              label="Paid"
              value={formatCurrency(invoice.amount_paid || 0, invoice.currency)}
              color="text-success-500"
            />
            <StatItem
              label="Balance Due"
              value={formatCurrency(balanceDue, invoice.currency)}
              color={balanceDue > 0 ? "text-warning-500" : "text-success-500"}
            />
          </StatsGrid>
        </div>

        {/* Invoice Details */}
        <Section title="Invoice Details">
          <InfoRow label="Invoice Number" value={invoice.invoice_number} />
          <InfoRow label="Issue Date" value={formatDate(invoice.issue_date)} />
          <InfoRow
            label="Due Date"
            value={
              <span className={invoice.status === "overdue" ? "text-error-500 font-medium" : ""}>
                {formatDate(invoice.due_date)}
              </span>
            }
          />
          <InfoRow label="Payment Terms" value={invoice.payment_terms?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} />
          <InfoRow label="Currency" value={invoice.currency} />
          {invoice.po_number && <InfoRow label="PO Number" value={invoice.po_number} />}
          {invoice.reference_number && <InfoRow label="Reference" value={invoice.reference_number} />}
        </Section>

        {/* Client Information */}
        <Section title="Client">
          <InfoRow
            label="Name"
            value={invoice.client?.name || invoice.billing_name || "-"}
          />
          {(invoice.client?.company) && (
            <InfoRow label="Company" value={invoice.client.company} />
          )}
          <InfoRow
            label="Email"
            value={
              (invoice.client?.email || invoice.billing_email) ? (
                <a
                  href={`mailto:${invoice.client?.email || invoice.billing_email}`}
                  className="text-brand-500 hover:text-brand-600"
                >
                  {invoice.client?.email || invoice.billing_email}
                </a>
              ) : null
            }
          />
          {invoice.billing_address && (
            <InfoRow label="Address" value={invoice.billing_address} />
          )}
          {invoice.billing_city && (
            <InfoRow label="City" value={`${invoice.billing_city}${invoice.billing_country ? `, ${invoice.billing_country}` : ""}`} />
          )}
        </Section>

        {/* Related Project */}
        {invoice.project && (
          <Section title="Project">
            <InfoRow label="Project" value={invoice.project.name} />
            {invoice.project.project_code && (
              <InfoRow label="Code" value={invoice.project.project_code} />
            )}
          </Section>
        )}

        {/* Line Items */}
        {invoice.items && invoice.items.length > 0 && (
          <Section title="Line Items">
            <div className="space-y-2">
              {invoice.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.quantity} x {formatCurrency(item.unit_price, invoice.currency)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {formatCurrency(item.amount || item.quantity * item.unit_price, invoice.currency)}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Financial Breakdown */}
        <Section title="Summary">
          <div className="space-y-2">
            <InfoRow label="Subtotal" value={formatCurrency(invoice.subtotal || invoice.total || invoice.amount, invoice.currency)} />
            {invoice.tax_rate > 0 && (
              <InfoRow
                label={`Tax (${invoice.tax_rate}%)`}
                value={formatCurrency(invoice.tax_amount || 0, invoice.currency)}
              />
            )}
            {invoice.discount_amount > 0 && (
              <InfoRow
                label="Discount"
                value={
                  <span className="text-error-500">
                    -{formatCurrency(invoice.discount_amount, invoice.currency)}
                  </span>
                }
              />
            )}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <InfoRow
                label="Total"
                value={
                  <span className="font-bold text-lg">
                    {formatCurrency(invoice.total || invoice.amount, invoice.currency)}
                  </span>
                }
              />
            </div>
          </div>
        </Section>

        {/* Status Actions */}
        {onStatusChange && !["paid", "cancelled", "refunded"].includes(invoice.status) && (
          <Section title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              {invoice.status === "draft" && (
                <button
                  onClick={() => onStatusChange(invoice, "sent")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
                >
                  Mark as Sent
                </button>
              )}
              {["sent", "viewed", "overdue", "partially_paid"].includes(invoice.status) && (
                <button
                  onClick={() => onStatusChange(invoice, "paid")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20 transition-colors"
                >
                  Mark as Paid
                </button>
              )}
              {["sent", "viewed"].includes(invoice.status) && (
                <button
                  onClick={() => onStatusChange(invoice, "overdue")}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 transition-colors"
                >
                  Mark as Overdue
                </button>
              )}
              <button
                onClick={() => onStatusChange(invoice, "cancelled")}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel Invoice
              </button>
            </div>
          </Section>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </Section>
        )}

        {/* Terms & Conditions */}
        {invoice.terms_and_conditions && (
          <Section title="Terms & Conditions" collapsible defaultOpen={false}>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {invoice.terms_and_conditions}
            </p>
          </Section>
        )}

        {/* Tags */}
        {invoice.tags && invoice.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {invoice.tags.map((tag, index) => (
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
          <p>Created: {formatDate(invoice.created_at)}</p>
          <p>Updated: {formatDate(invoice.updated_at)}</p>
          {invoice.sent_date && <p>Sent: {formatDate(invoice.sent_date)}</p>}
          {invoice.paid_at && <p>Paid: {formatDate(invoice.paid_at)}</p>}
        </div>
      </div>
    </DetailsSidebar>
  );
};

export default InvoiceDetailsSidebar;
