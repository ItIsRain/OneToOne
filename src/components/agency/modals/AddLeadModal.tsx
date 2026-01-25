"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    value: "",
    notes: "",
  });

  const sourceOptions = [
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "conference", label: "Conference" },
    { value: "cold-email", label: "Cold Email" },
    { value: "cold-call", label: "Cold Call" },
    { value: "social-media", label: "Social Media" },
    { value: "advertisement", label: "Advertisement" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Lead data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add New Lead
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the lead&apos;s information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              type="text"
              placeholder="Company name"
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 555-0100"
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="source">Lead Source</Label>
            <Select
              options={sourceOptions}
              placeholder="Select source"
              onChange={(value) => setFormData({ ...formData, source: value })}
            />
          </div>
          <div>
            <Label htmlFor="value">Estimated Value</Label>
            <Input
              id="value"
              type="text"
              placeholder="$10,000"
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <TextArea
            placeholder="Add any relevant notes about this lead..."
            onChange={(value) => setFormData({ ...formData, notes: value })}
            rows={3}
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
            Add Lead
          </button>
        </div>
      </form>
    </Modal>
  );
};
