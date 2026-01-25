"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const contractTypes = [
  { value: "service-agreement", label: "Service Agreement" },
  { value: "project-contract", label: "Project Contract" },
  { value: "retainer", label: "Retainer Agreement" },
  { value: "nda", label: "Non-Disclosure Agreement" },
  { value: "partnership", label: "Partnership Agreement" },
  { value: "employment", label: "Employment Contract" },
];

const clients = [
  { value: "acme", label: "Acme Corporation" },
  { value: "techstart", label: "TechStart Inc." },
  { value: "globaltech", label: "GlobalTech Solutions" },
  { value: "metro", label: "Metro Events" },
  { value: "creative", label: "Creative Co." },
];

export function NewContractModal({ isOpen, onClose }: NewContractModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    client: "",
    value: "",
    startDate: "",
    endDate: "",
    autoRenew: false,
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contract data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          New Contract
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="contractName">Contract Name</Label>
            <Input
              id="contractName"
              placeholder="e.g., Service Agreement - Acme Corp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Contract Type</Label>
              <Select
                options={contractTypes}
                defaultValue={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value })}
                placeholder="Select type"
              />
            </div>

            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                options={clients}
                defaultValue={formData.client}
                onChange={(value) => setFormData({ ...formData, client: value })}
                placeholder="Select client"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="value">Contract Value</Label>
            <Input
              id="value"
              placeholder="$0.00 (leave blank for N/A)"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRenew"
              checked={formData.autoRenew}
              onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="autoRenew" className="text-sm text-gray-600 dark:text-gray-400">
              Auto-renew contract
            </label>
          </div>

          <div>
            <Label htmlFor="description">Description / Terms</Label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Describe the contract terms and conditions..."
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
              Create Contract
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
