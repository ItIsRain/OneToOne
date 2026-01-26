"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { Expense } from "../ExpensesTable";

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface Project {
  id: string;
  name: string;
  project_code: string | null;
}

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  expense?: Expense | null;
}

const initialFormData = {
  description: "",
  amount: 0,
  currency: "USD",
  expense_date: new Date().toISOString().split("T")[0],
  category: "",
  project_id: "",
  client_id: "",
  vendor_name: "",
  payment_method: "",
  is_reimbursable: false,
  is_billable: false,
  receipt_url: "",
  receipt_number: "",
  tax_deductible: true,
  tax_category: "",
  notes: "",
  tags: [] as string[],
};

const categoryOptions = [
  { value: "travel", label: "Travel" },
  { value: "supplies", label: "Office Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "software", label: "Software" },
  { value: "marketing", label: "Marketing" },
  { value: "meals", label: "Meals & Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "salaries", label: "Salaries" },
  { value: "contractors", label: "Contractors" },
  { value: "insurance", label: "Insurance" },
  { value: "taxes", label: "Taxes" },
  { value: "entertainment", label: "Entertainment" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
];

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "check", label: "Check" },
  { value: "company_card", label: "Company Card" },
  { value: "petty_cash", label: "Petty Cash" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
  { value: "AED", label: "AED" },
  { value: "SAR", label: "SAR" },
  { value: "INR", label: "INR (\u20B9)" },
];

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expense,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Fetch clients and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, projectsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/projects"),
        ]);

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Reset form when modal opens or expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || "",
        amount: expense.amount || 0,
        currency: expense.currency || "USD",
        expense_date: expense.expense_date || new Date().toISOString().split("T")[0],
        category: expense.category || "",
        project_id: expense.project_id || "",
        client_id: expense.client_id || "",
        vendor_name: expense.vendor_name || "",
        payment_method: expense.payment_method || "",
        is_reimbursable: expense.is_reimbursable || false,
        is_billable: expense.is_billable || false,
        receipt_url: expense.receipt_url || "",
        receipt_number: expense.receipt_number || "",
        tax_deductible: expense.tax_deductible !== false,
        tax_category: expense.tax_category || "",
        notes: expense.notes || "",
        tags: expense.tags || [],
      });

      // Show optional fields if any are filled
      if (
        expense.vendor_name ||
        expense.receipt_url ||
        expense.receipt_number ||
        expense.tax_category ||
        expense.notes
      ) {
        setShowOptionalFields(true);
      }
    } else {
      setFormData(initialFormData);
      setShowOptionalFields(false);
    }
    setError("");
  }, [expense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      setError("Please enter a description");
      return;
    }

    if (formData.amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses";
      const method = expense ? "PATCH" : "POST";

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
        throw new Error(data.error || "Failed to save expense");
      }

      onSave(data.expense);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {expense ? "Edit Expense" : "Add Expense"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {expense ? "Update expense details" : "Track a new business expense"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div>
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            type="text"
            placeholder="e.g., Office supplies, Client lunch"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

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
            <Label htmlFor="expense_date">Date *</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Select category</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="project_id">Project (Optional)</Label>
            <select
              id="project_id"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code ? `[${project.project_code}] ` : ""}{project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="client_id">Client (Optional)</Label>
            <select
              id="client_id"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
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
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_billable}
              onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Billable to client</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_reimbursable}
              onChange={(e) => setFormData({ ...formData, is_reimbursable: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Reimbursable</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.tax_deductible}
              onChange={(e) => setFormData({ ...formData, tax_deductible: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Tax deductible</span>
          </label>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Total Amount</span>
            <span className="font-bold text-xl text-gray-800 dark:text-white">{formatCurrency(formData.amount)}</span>
          </div>
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
                <Label htmlFor="vendor_name">Vendor Name</Label>
                <Input
                  id="vendor_name"
                  type="text"
                  placeholder="Company or person paid"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="receipt_number">Receipt Number</Label>
                <Input
                  id="receipt_number"
                  type="text"
                  placeholder="Receipt or invoice number"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="receipt_url">Receipt URL</Label>
                <Input
                  id="receipt_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.receipt_url}
                  onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="tax_category">Tax Category</Label>
                <Input
                  id="tax_category"
                  type="text"
                  placeholder="e.g., Business Expense"
                  value={formData.tax_category}
                  onChange={(e) => setFormData({ ...formData, tax_category: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Additional details about this expense"
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
            {isSaving ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
