"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const departments = [
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "events", label: "Events" },
  { value: "technology", label: "Technology" },
  { value: "travel", label: "Travel" },
  { value: "hr", label: "Human Resources" },
  { value: "sales", label: "Sales" },
];

const periods = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "project", label: "Project-based" },
];

export function CreateBudgetModal({ isOpen, onClose }: CreateBudgetModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    period: "monthly",
    amount: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Budget data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Create Budget
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="budgetName">Budget Name</Label>
            <Input
              id="budgetName"
              placeholder="e.g., Q1 Marketing Budget"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                options={departments}
                defaultValue={formData.department}
                onChange={(value) => setFormData({ ...formData, department: value })}
                placeholder="Select department"
              />
            </div>

            <div>
              <Label htmlFor="period">Budget Period</Label>
              <Select
                options={periods}
                defaultValue={formData.period}
                onChange={(value) => setFormData({ ...formData, period: value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Allocated Amount</Label>
            <Input
              id="amount"
              placeholder="$0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Describe the purpose of this budget..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              Create Budget
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
