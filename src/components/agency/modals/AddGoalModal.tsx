"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  auto_track: boolean;
  track_entity: string | null;
  period_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  category: string | null;
  color: string;
  icon: string | null;
}

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  goal?: Goal | null;
}

const targetTypes = [
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "percentage", label: "Percentage" },
  { value: "boolean", label: "Yes/No" },
];

const periodTypes = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

const categories = [
  { value: "revenue", label: "Revenue" },
  { value: "growth", label: "Growth" },
  { value: "productivity", label: "Productivity" },
  { value: "customer", label: "Customer" },
  { value: "team", label: "Team" },
  { value: "custom", label: "Custom" },
];

const trackableEntities = [
  { value: "", label: "Manual tracking" },
  { value: "revenue", label: "Total Revenue (Payments)" },
  { value: "clients", label: "New Clients" },
  { value: "projects", label: "Completed Projects" },
  { value: "tasks", label: "Completed Tasks" },
  { value: "invoices", label: "Paid Invoices" },
  { value: "events", label: "Completed Events" },
];

const colorOptions = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

const iconOptions = ["🎯", "📈", "💰", "🚀", "⭐", "🏆", "📊", "✅", "🔥", "💡"];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  goal,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_type: "number",
    target_value: "",
    current_value: "0",
    unit: "",
    auto_track: false,
    track_entity: "",
    period_type: "monthly",
    start_date: "",
    end_date: "",
    category: "custom",
    color: "#3B82F6",
    icon: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description || "",
        target_type: goal.target_type,
        target_value: goal.target_value?.toString() || "",
        current_value: goal.current_value.toString(),
        unit: goal.unit || "",
        auto_track: goal.auto_track,
        track_entity: goal.track_entity || "",
        period_type: goal.period_type,
        start_date: goal.start_date || "",
        end_date: goal.end_date || "",
        category: goal.category || "custom",
        color: goal.color,
        icon: goal.icon || "",
      });
      setShowOptionalFields(true);
    } else {
      // Set default dates for the current period
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setFormData({
        title: "",
        description: "",
        target_type: "number",
        target_value: "",
        current_value: "0",
        unit: "",
        auto_track: false,
        track_entity: "",
        period_type: "monthly",
        start_date: startOfMonth.toISOString().split("T")[0],
        end_date: endOfMonth.toISOString().split("T")[0],
        category: "custom",
        color: "#3B82F6",
        icon: "",
      });
      setShowOptionalFields(false);
    }
    setError("");
  }, [goal, isOpen]);

  // Auto-set unit based on target type
  useEffect(() => {
    if (formData.target_type === "currency" && !formData.unit) {
      setFormData((prev) => ({ ...prev, unit: "USD" }));
    } else if (formData.target_type === "percentage" && !formData.unit) {
      setFormData((prev) => ({ ...prev, unit: "%" }));
    }
  }, [formData.target_type, formData.unit]);

  // Auto-enable tracking when entity is selected
  useEffect(() => {
    if (formData.track_entity) {
      setFormData((prev) => ({ ...prev, auto_track: true }));
    }
  }, [formData.track_entity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.target_value && formData.target_type !== "boolean") {
      setError("Target value is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url = goal ? `/api/goals/${goal.id}` : "/api/goals";
      const method = goal ? "PATCH" : "POST";

      const body = {
        title: formData.title,
        description: formData.description || null,
        target_type: formData.target_type,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        current_value: parseFloat(formData.current_value) || 0,
        unit: formData.unit || null,
        auto_track: formData.auto_track,
        track_entity: formData.track_entity || null,
        period_type: formData.period_type,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        category: formData.category,
        color: formData.color,
        icon: formData.icon || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save goal");
      }

      onSave(data.goal);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {goal ? "Edit Goal" : "New Goal"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {goal ? "Update your goal" : "Set a new goal or KPI to track"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
        {/* Title */}
        <div>
          <Label htmlFor="title">Goal Title *</Label>
          <Input
            id="title"
            type="text"
            placeholder="e.g., Reach $50,000 in monthly revenue"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Target Type & Value */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="target_type">Target Type *</Label>
            <select
              id="target_type"
              value={formData.target_type}
              onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {targetTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="target_value">Target Value *</Label>
            <div className="relative">
              {formData.target_type === "currency" && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              )}
              <Input
                id="target_value"
                type="number"
                placeholder="100"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                className={formData.target_type === "currency" ? "pl-7" : ""}
              />
              {formData.target_type === "percentage" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              )}
            </div>
          </div>
        </div>

        {/* Period & Category */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="period_type">Period</Label>
            <select
              id="period_type"
              value={formData.period_type}
              onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {periodTypes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto-tracking */}
        <div>
          <Label htmlFor="track_entity">Automatic Tracking</Label>
          <select
            id="track_entity"
            value={formData.track_entity}
            onChange={(e) => setFormData({ ...formData, track_entity: e.target.value })}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {trackableEntities.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select what to track automatically, or leave as manual
          </p>
        </div>

        {/* Color & Icon */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? "border-gray-800 dark:border-white scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Icon (Optional)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: formData.icon === icon ? "" : icon })}
                  className={`w-8 h-8 rounded-lg border-2 text-lg flex items-center justify-center transition-all ${
                    formData.icon === icon
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
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
          {showOptionalFields ? "Hide" : "Show"} additional options
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-5 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={2}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                placeholder="Describe your goal..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
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
                />
              </div>
            </div>

            {/* Current Value (for editing) */}
            {goal && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="current_value">Current Progress</Label>
                  <Input
                    id="current_value"
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit (Optional)</Label>
                  <Input
                    id="unit"
                    type="text"
                    placeholder="e.g., clients, hours"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
