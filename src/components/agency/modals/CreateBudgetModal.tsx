"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { Budget } from "../BudgetsTable";

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

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Budget) => void;
  budget?: Budget | null;
}

const initialFormData = {
  name: "",
  description: "",
  amount: 0,
  spent: 0,
  currency: "USD",
  period_type: "monthly",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  category: "",
  project_id: "",
  client_id: "",
  department: "",
  alert_threshold: 80,
  status: "active",
  notes: "",
  rollover_enabled: false,
  rollover_amount: 0,
  fiscal_year: new Date().getFullYear(),
  is_recurring: false,
  recurrence_interval: "",
};

const categoryOptions = [
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "payroll", label: "Payroll" },
  { value: "travel", label: "Travel" },
  { value: "equipment", label: "Equipment" },
  { value: "software", label: "Software" },
  { value: "contractors", label: "Contractors" },
  { value: "events", label: "Events" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const periodOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "project", label: "Project-based" },
  { value: "custom", label: "Custom Period" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
  { value: "AED", label: "AED" },
  { value: "SAR", label: "SAR" },
  { value: "INR", label: "INR (\u20B9)" },
];

const departmentOptions = [
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "engineering", label: "Engineering" },
  { value: "operations", label: "Operations" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "design", label: "Design" },
  { value: "product", label: "Product" },
  { value: "customer_success", label: "Customer Success" },
  { value: "other", label: "Other" },
];

export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  budget,
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

  // Reset form when modal opens or budget changes
  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name || "",
        description: budget.description || "",
        amount: budget.amount || 0,
        spent: budget.spent || 0,
        currency: budget.currency || "USD",
        period_type: budget.period_type || "monthly",
        start_date: budget.start_date || new Date().toISOString().split("T")[0],
        end_date: budget.end_date || "",
        category: budget.category || "",
        project_id: budget.project_id || "",
        client_id: budget.client_id || "",
        department: budget.department || "",
        alert_threshold: budget.alert_threshold || 80,
        status: budget.status || "active",
        notes: budget.notes || "",
        rollover_enabled: budget.rollover_enabled || false,
        rollover_amount: budget.rollover_amount || 0,
        fiscal_year: budget.fiscal_year || new Date().getFullYear(),
        is_recurring: budget.is_recurring || false,
        recurrence_interval: budget.recurrence_interval || "",
      });

      // Show optional fields if any are filled
      if (
        budget.department ||
        budget.client_id ||
        budget.rollover_enabled ||
        budget.notes ||
        budget.is_recurring
      ) {
        setShowOptionalFields(true);
      }
    } else {
      setFormData(initialFormData);
      setShowOptionalFields(false);
    }
    setError("");
  }, [budget, isOpen]);

  // Calculate end date based on period type
  useEffect(() => {
    if (formData.start_date && formData.period_type && formData.period_type !== "custom" && formData.period_type !== "project") {
      const startDate = new Date(formData.start_date);
      let endDate: Date;

      switch (formData.period_type) {
        case "monthly":
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          break;
        case "quarterly":
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
          break;
        case "yearly":
          endDate = new Date(startDate.getFullYear(), 11, 31);
          break;
        default:
          return;
      }

      setFormData(prev => ({
        ...prev,
        end_date: endDate.toISOString().split("T")[0],
      }));
    }
  }, [formData.period_type, formData.start_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter a budget name");
      return;
    }

    if (formData.amount <= 0) {
      setError("Please enter a valid budget amount");
      return;
    }

    if (!formData.start_date) {
      setError("Please select a start date");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = budget ? `/api/budgets/${budget.id}` : "/api/budgets";
      const method = budget ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(String(formData.amount)) || 0,
          spent: parseFloat(String(formData.spent)) || 0,
          alert_threshold: parseFloat(String(formData.alert_threshold)) || 80,
          rollover_amount: parseFloat(String(formData.rollover_amount)) || 0,
          fiscal_year: parseInt(String(formData.fiscal_year)) || new Date().getFullYear(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save budget");
      }

      onSave(data.budget);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: formData.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const remaining = Math.max(0, formData.amount - formData.spent);
  const utilization = formData.amount > 0 ? Math.round((formData.spent / formData.amount) * 100) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {budget ? "Edit Budget" : "Create Budget"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {budget ? "Update budget details" : "Set up a new budget to track spending"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div>
          <Label htmlFor="name">Budget Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Q1 Marketing Budget"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="amount">Budget Amount *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
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

        {/* If editing, show spent amount */}
        {budget && (
          <div>
            <Label htmlFor="spent">Amount Spent</Label>
            <Input
              id="spent"
              type="number"
              placeholder="0"
              min="0"
              step={0.01}
              value={formData.spent || ""}
              onChange={(e) => setFormData({ ...formData, spent: parseFloat(e.target.value) || 0 })}
            />
          </div>
        )}

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
            <Label htmlFor="period_type">Budget Period</Label>
            <select
              id="period_type"
              value={formData.period_type}
              onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              disabled={formData.period_type !== "custom" && formData.period_type !== "project"}
            />
            {formData.period_type !== "custom" && formData.period_type !== "project" && (
              <p className="text-xs text-gray-400 mt-1">Auto-calculated based on period</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="project_id">Link to Project (Optional)</Label>
            <select
              id="project_id"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code ? `[${project.project_code}] ` : ""}{project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="alert_threshold">Alert Threshold (%)</Label>
            <Input
              id="alert_threshold"
              type="number"
              placeholder="80"
              min="0"
              max="100"
              value={formData.alert_threshold || ""}
              onChange={(e) => setFormData({ ...formData, alert_threshold: parseFloat(e.target.value) || 80 })}
            />
            <p className="text-xs text-gray-400 mt-1">Get alerted when spending reaches this %</p>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 dark:text-gray-400">Budget Summary</span>
            <span className="font-bold text-xl text-gray-800 dark:text-white">{formatCurrency(formData.amount)}</span>
          </div>
          {budget && (
            <>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Spent</span>
                <span className={`font-medium ${utilization >= 100 ? "text-error-500" : utilization >= 80 ? "text-warning-500" : "text-gray-700 dark:text-gray-300"}`}>
                  {formatCurrency(formData.spent)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-500">Remaining</span>
                <span className="font-medium text-success-500">{formatCurrency(remaining)}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    utilization >= 100 ? "bg-error-500" : utilization >= 80 ? "bg-warning-500" : "bg-success-500"
                  }`}
                  style={{ width: `${Math.min(100, utilization)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">{utilization}% utilized</p>
            </>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            placeholder="What is this budget for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          {showOptionalFields ? "Hide" : "Show"} additional options
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-5 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                  <option value="">No client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company && `- ${client.company}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="fiscal_year">Fiscal Year</Label>
                <Input
                  id="fiscal_year"
                  type="number"
                  placeholder={String(new Date().getFullYear())}
                  min="2020"
                  max="2100"
                  value={formData.fiscal_year || ""}
                  onChange={(e) => setFormData({ ...formData, fiscal_year: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rollover_enabled}
                    onChange={(e) => setFormData({ ...formData, rollover_enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable rollover</span>
                </label>
              </div>
            </div>

            {formData.rollover_enabled && (
              <div>
                <Label htmlFor="rollover_amount">Rollover Amount</Label>
                <Input
                  id="rollover_amount"
                  type="number"
                  placeholder="0"
                  min="0"
                  step={0.01}
                  value={formData.rollover_amount || ""}
                  onChange={(e) => setFormData({ ...formData, rollover_amount: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-400 mt-1">Amount carried over from previous period</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Recurring budget</span>
              </label>
            </div>

            {formData.is_recurring && (
              <div>
                <Label htmlFor="recurrence_interval">Recurrence Interval</Label>
                <select
                  id="recurrence_interval"
                  value={formData.recurrence_interval}
                  onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value })}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Select interval</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Additional notes about this budget"
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
            {isSaving ? "Saving..." : budget ? "Update Budget" : "Create Budget"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Also export as default for backwards compatibility
export default CreateBudgetModal;
