"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { Payment } from "../PaymentsTable";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  amount_paid: number;
  currency: string;
  status: string;
  client?: {
    id: string;
    name: string;
  } | null;
}

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  payment?: Payment | null;
}

const initialFormData = {
  invoice_id: "",
  client_id: "",
  client_name: "",
  amount: 0,
  currency: "USD",
  payment_date: new Date().toISOString().split("T")[0],
  payment_method: "",
  transaction_id: "",
  reference_number: "",
  status: "completed",
  notes: "",
};

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "check", label: "Check" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
  { value: "AED", label: "AED" },
  { value: "SAR", label: "SAR" },
  { value: "INR", label: "INR (\u20B9)" },
];

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  payment,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Fetch clients and invoices
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, invoicesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/invoices"),
        ]);

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          // Only show unpaid/partially paid invoices
          const unpaidInvoices = (data.invoices || []).filter(
            (inv: Invoice) => !["paid", "cancelled", "refunded"].includes(inv.status)
          );
          setInvoices(unpaidInvoices);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Reset form when modal opens or payment changes
  useEffect(() => {
    if (payment) {
      setFormData({
        invoice_id: payment.invoice_id || "",
        client_id: payment.client_id || "",
        client_name: payment.client_name || "",
        amount: payment.amount || 0,
        currency: payment.currency || "USD",
        payment_date: payment.payment_date || new Date().toISOString().split("T")[0],
        payment_method: payment.payment_method || "",
        transaction_id: payment.transaction_id || "",
        reference_number: payment.reference_number || "",
        status: payment.status || "completed",
        notes: payment.notes || "",
      });

      // Show optional fields if any are filled
      if (
        payment.transaction_id ||
        payment.reference_number ||
        payment.notes
      ) {
        setShowOptionalFields(true);
      }
    } else {
      setFormData(initialFormData);
      setShowOptionalFields(false);
    }
    setError("");
  }, [payment, isOpen]);

  // When invoice is selected, auto-fill client and amount
  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      const balanceDue = (invoice.total || 0) - (invoice.amount_paid || 0);
      setFormData({
        ...formData,
        invoice_id: invoiceId,
        client_id: invoice.client?.id || "",
        client_name: invoice.client?.name || "",
        amount: balanceDue > 0 ? balanceDue : invoice.total,
        currency: invoice.currency || "USD",
      });
    } else {
      setFormData({
        ...formData,
        invoice_id: invoiceId,
      });
    }
  };

  // When client is selected, update client_name
  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: client?.name || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!formData.client_id && !formData.client_name) {
      setError("Please select a client or enter a client name");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = payment ? `/api/payments/${payment.id}` : "/api/payments";
      const method = payment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(String(formData.amount)) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save payment");
      }

      onSave(data.payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: formData.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get selected invoice balance
  const selectedInvoice = invoices.find((inv) => inv.id === formData.invoice_id);
  const invoiceBalance = selectedInvoice
    ? (selectedInvoice.total || 0) - (selectedInvoice.amount_paid || 0)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {payment ? "Edit Payment" : "Record Payment"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {payment ? "Update payment details" : "Record a payment received"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Invoice Selection */}
        <div>
          <Label htmlFor="invoice_id">Link to Invoice (Optional)</Label>
          <select
            id="invoice_id"
            value={formData.invoice_id}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="">No invoice (standalone payment)</option>
            {invoices.map((invoice) => {
              const balance = (invoice.total || 0) - (invoice.amount_paid || 0);
              return (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} - {formatCurrency(balance)} due
                  {invoice.client?.name && ` (${invoice.client.name})`}
                </option>
              );
            })}
          </select>
          {invoiceBalance !== null && invoiceBalance > 0 && (
            <p className="mt-1 text-xs text-warning-500">
              Balance due: {formatCurrency(invoiceBalance)}
            </p>
          )}
        </div>

        {/* Client Selection */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="client_id">Client</Label>
            <select
              id="client_id"
              value={formData.client_id}
              onChange={(e) => handleClientChange(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company && `- ${client.company}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="client_name">Or enter client name</Label>
            <Input
              id="client_name"
              type="text"
              placeholder="Client name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
          </div>
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              min="0"
              step={0.01}
              value={formData.amount || ""}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="payment_date">Payment Date *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            />
          </div>
        </div>

        {/* Payment Method and Status */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <select
              id="payment_method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Select method</option>
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Payment Amount</span>
            <span className="font-bold text-xl text-success-500">{formatCurrency(formData.amount)}</span>
          </div>
          {formData.invoice_id && selectedInvoice && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice Total</span>
                <span className="text-gray-700 dark:text-gray-300">{formatCurrency(selectedInvoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Already Paid</span>
                <span className="text-gray-700 dark:text-gray-300">{formatCurrency(selectedInvoice.amount_paid || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-500">Remaining After</span>
                <span className={invoiceBalance !== null && invoiceBalance - formData.amount <= 0 ? "text-success-500" : "text-warning-500"}>
                  {formatCurrency(Math.max(0, (invoiceBalance || 0) - formData.amount))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Optional Fields */}
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showOptionalFields ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showOptionalFields ? "Hide" : "Show"} additional details
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-5 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-4">
              <div>
                <Label htmlFor="transaction_id">Transaction ID</Label>
                <Input
                  id="transaction_id"
                  type="text"
                  placeholder="Bank or processor transaction ID"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  type="text"
                  placeholder="Check number, receipt number, etc."
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Additional details about this payment"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-error-500">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : payment ? "Update Payment" : "Record Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
