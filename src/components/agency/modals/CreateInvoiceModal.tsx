"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    client: "",
    event: "",
    amount: "",
    dueDate: "",
    status: "",
    notes: "",
  });

  const clientOptions = [
    { value: "acme", label: "Acme Corporation" },
    { value: "techstart", label: "TechStart Inc." },
    { value: "globaltech", label: "GlobalTech Solutions" },
    { value: "metro", label: "Metro Events" },
    { value: "creative", label: "Creative Co." },
  ];

  const eventOptions = [
    { value: "product-launch", label: "Product Launch" },
    { value: "annual-gala", label: "Annual Gala" },
    { value: "tech-conference", label: "Tech Conference" },
    { value: "brand-workshop", label: "Brand Workshop" },
    { value: "team-building", label: "Team Building" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Send Immediately" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Invoice data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Create Invoice
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate a new invoice for a client
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="client">Client</Label>
            <Select
              options={clientOptions}
              placeholder="Select client"
              onChange={(value) => setFormData({ ...formData, client: value })}
            />
          </div>

          <div>
            <Label htmlFor="event">Event</Label>
            <Select
              options={eventOptions}
              placeholder="Select event"
              onChange={(value) => setFormData({ ...formData, event: value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="status">Invoice Status</Label>
          <Select
            options={statusOptions}
            placeholder="Select status"
            onChange={(value) => setFormData({ ...formData, status: value })}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <TextArea
            placeholder="Add any additional notes or line items..."
            onChange={(value) => setFormData({ ...formData, notes: value })}
            rows={3}
          />
        </div>

        {/* Invoice Preview */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
            Invoice Preview
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {formData.client ? clientOptions.find(c => c.value === formData.client)?.label : "Select client"}
            </span>
            <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
              ${formData.amount || "0.00"}
            </span>
          </div>
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
            Create Invoice
          </button>
        </div>
      </form>
    </Modal>
  );
};
