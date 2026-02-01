"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { toast } from "sonner";
import type { Invoice, InvoiceItem } from "../InvoicesTable";
import { AIFieldButton } from "@/components/ai/AIFieldButton";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface Project {
  id: string;
  name: string;
  project_code: string | null;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  invoice?: Invoice | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
}

const initialFormData = {
  title: "",
  client_id: "",
  project_id: "",
  subtotal: 0,
  tax_rate: 0,
  discount_type: "fixed" as "fixed" | "percentage",
  discount_value: 0,
  currency: "USD",
  status: "draft",
  issue_date: new Date().toISOString().split("T")[0],
  due_date: "",
  payment_terms: "net_30",
  notes: "",
  terms_and_conditions: "",
  billing_name: "",
  billing_email: "",
  billing_address: "",
  po_number: "",
};

const paymentTermsOptions = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_7", label: "Net 7 Days" },
  { value: "net_15", label: "Net 15 Days" },
  { value: "net_30", label: "Net 30 Days" },
  { value: "net_45", label: "Net 45 Days" },
  { value: "net_60", label: "Net 60 Days" },
];

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
  { value: "AED", label: "AED" },
  { value: "SAR", label: "SAR" },
  { value: "INR", label: "INR (\u20B9)" },
];

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  invoice,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unit_price: 0, unit: "unit" },
  ]);

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

  // Reset form when modal opens or invoice changes
  useEffect(() => {
    if (invoice) {
      setFormData({
        title: invoice.title || "",
        client_id: invoice.client_id || "",
        project_id: invoice.project_id || "",
        subtotal: invoice.subtotal || invoice.total || invoice.amount || 0,
        tax_rate: invoice.tax_rate || 0,
        discount_type: (invoice.discount_type as "fixed" | "percentage") || "fixed",
        discount_value: invoice.discount_value || 0,
        currency: invoice.currency || "USD",
        status: invoice.status || "draft",
        issue_date: invoice.issue_date || new Date().toISOString().split("T")[0],
        due_date: invoice.due_date || "",
        payment_terms: invoice.payment_terms || "net_30",
        notes: invoice.notes || "",
        terms_and_conditions: invoice.terms_and_conditions || "",
        billing_name: invoice.billing_name || "",
        billing_email: invoice.billing_email || "",
        billing_address: invoice.billing_address || "",
        po_number: invoice.po_number || "",
      });

      // Set line items if available
      if (invoice.items && invoice.items.length > 0) {
        setLineItems(
          invoice.items.map((item: InvoiceItem) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit: item.unit || "unit",
          }))
        );
      } else {
        setLineItems([
          { id: "1", description: "", quantity: 1, unit_price: 0, unit: "unit" },
        ]);
      }

      // Show optional fields if any are filled
      if (
        invoice.billing_name ||
        invoice.billing_email ||
        invoice.po_number ||
        invoice.terms_and_conditions
      ) {
        setShowOptionalFields(true);
      }
    } else {
      setFormData(initialFormData);
      setLineItems([
        { id: "1", description: "", quantity: 1, unit_price: 0, unit: "unit" },
      ]);
      setShowOptionalFields(false);
    }
    setError("");
  }, [invoice, isOpen]);

  // Calculate due date based on payment terms
  useEffect(() => {
    if (formData.payment_terms && formData.issue_date) {
      const issueDate = new Date(formData.issue_date);
      let daysToAdd = 30;

      switch (formData.payment_terms) {
        case "due_on_receipt":
          daysToAdd = 0;
          break;
        case "net_7":
          daysToAdd = 7;
          break;
        case "net_15":
          daysToAdd = 15;
          break;
        case "net_30":
          daysToAdd = 30;
          break;
        case "net_45":
          daysToAdd = 45;
          break;
        case "net_60":
          daysToAdd = 60;
          break;
      }

      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      setFormData((prev) => ({
        ...prev,
        due_date: dueDate.toISOString().split("T")[0],
      }));
    }
  }, [formData.payment_terms, formData.issue_date]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const discountAmount =
      formData.discount_type === "percentage"
        ? subtotal * (formData.discount_value / 100)
        : formData.discount_value;
    const total = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, discountAmount, total };
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        unit_price: 0,
        unit: "unit",
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      billing_name: client?.name || "",
      billing_email: client?.email || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const hasItems = lineItems.some(
      (item) => item.description && item.quantity > 0 && item.unit_price > 0
    );
    if (!hasItems && total <= 0) {
      setError("Please add at least one line item or set a total amount");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = invoice ? `/api/invoices/${invoice.id}` : "/api/invoices";
      const method = invoice ? "PATCH" : "POST";

      const validItems = lineItems.filter(
        (item) => item.description && item.quantity > 0
      );

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total,
          items: validItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit: item.unit,
            sort_order: index,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save invoice");
        return;
      }

      onSave(data.invoice);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save invoice");
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-6 lg:p-8">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {invoice ? "Edit Invoice" : "Create Invoice"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {invoice ? "Update invoice details" : "Generate a new invoice for a client"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="client_id">Client</Label>
            <select
              id="client_id"
              value={formData.client_id}
              onChange={(e) => handleClientChange(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">Select client (optional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company && `- ${client.company}`}
                </option>
              ))}
            </select>
          </div>

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
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Invoice Title (Optional)</Label>
              <AIFieldButton
                module="invoices"
                field="title"
                currentValue={formData.title}
                context={{ client_id: formData.client_id, currency: formData.currency, payment_terms: formData.payment_terms }}
                onGenerate={(value) => setFormData({ ...formData, title: value })}
              />
            </div>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Website Development"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="issue_date">Issue Date</Label>
            <Input
              id="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <select
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {paymentTermsOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Line Items</Label>
            <button
              type="button"
              onClick={addLineItem}
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="col-span-5">
                  {index === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Description</span>
                  )}
                  <Input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Qty</span>
                  )}
                  <Input
                    type="number"
                    placeholder="1"
                    min="0"
                    step={0.01}
                    value={item.quantity || ""}
                    onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3">
                  {index === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Unit Price</span>
                  )}
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step={0.01}
                    value={item.unit_price || ""}
                    onChange={(e) => updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2 flex items-end gap-2">
                  <div className="flex-1">
                    {index === 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Amount</span>
                    )}
                    <p className="h-11 flex items-center font-medium text-gray-800 dark:text-white">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </p>
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="h-11 px-2 text-error-500 hover:text-error-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax & Discount */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              placeholder="0"
              min="0"
              max="100"
              step={0.01}
              value={formData.tax_rate || ""}
              onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label htmlFor="discount_value">
              Discount ({formData.discount_type === "percentage" ? "%" : formData.currency})
            </Label>
            <div className="flex gap-2">
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as "fixed" | "percentage" })}
                className="h-11 w-24 appearance-none rounded-lg border border-gray-300 bg-transparent px-2 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="fixed">Fixed</option>
                <option value="percentage">%</option>
              </select>
              <Input
                id="discount_value"
                type="number"
                placeholder="0"
                min="0"
                step={0.01}
                value={formData.discount_value || ""}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-800 dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
            {formData.tax_rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tax ({formData.tax_rate}%)</span>
                <span className="text-gray-800 dark:text-white">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Discount</span>
                <span className="text-error-500">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <span className="font-semibold text-gray-800 dark:text-white">Total</span>
              <span className="font-bold text-lg text-gray-800 dark:text-white">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Due Date</span>
              <span className="text-gray-600 dark:text-gray-300">
                {formData.due_date ? new Date(formData.due_date).toLocaleDateString() : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notes">Notes (Visible on Invoice)</Label>
            <AIFieldButton
              module="invoices"
              field="notes"
              currentValue={formData.notes}
              context={{ title: formData.title, currency: formData.currency, payment_terms: formData.payment_terms }}
              onGenerate={(value) => setFormData({ ...formData, notes: value })}
            />
          </div>
          <textarea
            id="notes"
            placeholder="Thank you for your business!"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
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
          {showOptionalFields ? "Hide" : "Show"} billing details & terms
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-5 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-4">
              <div>
                <Label htmlFor="billing_name">Billing Name</Label>
                <Input
                  id="billing_name"
                  type="text"
                  placeholder="Billing contact name"
                  value={formData.billing_name}
                  onChange={(e) => setFormData({ ...formData, billing_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="billing_email">Billing Email</Label>
                <Input
                  id="billing_email"
                  type="email"
                  placeholder="billing@company.com"
                  value={formData.billing_email}
                  onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="billing_address">Billing Address</Label>
                <Input
                  id="billing_address"
                  type="text"
                  placeholder="Street address"
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="po_number">PO Number</Label>
                <Input
                  id="po_number"
                  type="text"
                  placeholder="Purchase order number"
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                <AIFieldButton
                  module="invoices"
                  field="terms_and_conditions"
                  currentValue={formData.terms_and_conditions}
                  context={{ title: formData.title, currency: formData.currency, payment_terms: formData.payment_terms }}
                  onGenerate={(value) => setFormData({ ...formData, terms_and_conditions: value })}
                />
              </div>
              <textarea
                id="terms_and_conditions"
                placeholder="Payment terms, late fees, etc."
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                rows={3}
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
            {isSaving ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
