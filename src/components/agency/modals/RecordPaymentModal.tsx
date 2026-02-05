"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentMethods = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const clients = [
  { value: "acme", label: "Acme Corporation" },
  { value: "techstart", label: "TechStart Inc." },
  { value: "globaltech", label: "GlobalTech Solutions" },
  { value: "metro", label: "Metro Events" },
  { value: "creative", label: "Creative Co." },
];

const invoices = [
  { value: "INV-1024", label: "INV-1024 - $4,500" },
  { value: "INV-1025", label: "INV-1025 - $12,800" },
  { value: "INV-1026", label: "INV-1026 - $8,200" },
  { value: "INV-1027", label: "INV-1027 - $15,000" },
];

export function RecordPaymentModal({ isOpen, onClose }: RecordPaymentModalProps) {
  const [formData, setFormData] = useState({
    client: "",
    invoice: "",
    amount: "",
    method: "bank_transfer",
    date: "",
    reference: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Payment data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Record Payment
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                options={clients}
                defaultValue={formData.client}
                onChange={(value) => setFormData({ ...formData, client: value })}
                placeholder="Select client"
              />
            </div>

            <div>
              <Label htmlFor="invoice">Invoice</Label>
              <Select
                options={invoices}
                defaultValue={formData.invoice}
                onChange={(value) => setFormData({ ...formData, invoice: value })}
                placeholder="Select invoice"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                placeholder="$0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select
                options={paymentMethods}
                defaultValue={formData.method}
                onChange={(value) => setFormData({ ...formData, method: value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                placeholder="e.g., TXN-12345"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Add any notes about this payment..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
