"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    description: "",
    category: "",
    amount: "",
    date: "",
    project: "",
    vendor: "",
    receipt: null as File | null,
    notes: "",
  });

  const categoryOptions = [
    { value: "venues", label: "Venues" },
    { value: "food-beverage", label: "Food & Beverage" },
    { value: "marketing", label: "Marketing" },
    { value: "technology", label: "Technology" },
    { value: "travel", label: "Travel" },
    { value: "equipment", label: "Equipment" },
    { value: "supplies", label: "Office Supplies" },
    { value: "professional-services", label: "Professional Services" },
    { value: "utilities", label: "Utilities" },
    { value: "other", label: "Other" },
  ];

  const projectOptions = [
    { value: "product-launch", label: "Product Launch" },
    { value: "annual-gala", label: "Annual Gala" },
    { value: "brand-campaign", label: "Brand Campaign" },
    { value: "tech-conference", label: "Tech Conference" },
    { value: "operations", label: "Operations (No Project)" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Expense data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add Expense
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Record a new business expense
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            type="text"
            placeholder="What was this expense for?"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              options={categoryOptions}
              placeholder="Select category"
              onChange={(value) => setFormData({ ...formData, category: value })}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="text"
              placeholder="$0.00"
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="project">Project</Label>
            <Select
              options={projectOptions}
              placeholder="Link to project"
              onChange={(value) => setFormData({ ...formData, project: value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="vendor">Vendor / Supplier</Label>
          <Input
            id="vendor"
            type="text"
            placeholder="Vendor name"
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="receipt">Receipt (Optional)</Label>
          <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-4 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Drop a file here, or{" "}
                <button type="button" className="text-brand-500 hover:text-brand-600 font-medium">
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <TextArea
            placeholder="Any additional details..."
            onChange={(value) => setFormData({ ...formData, notes: value })}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add Expense
          </button>
        </div>
      </form>
    </Modal>
  );
};
