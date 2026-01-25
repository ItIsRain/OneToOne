"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    client: "",
  });

  const clientOptions = [
    { value: "acme", label: "Acme Corporation" },
    { value: "techstart", label: "TechStart Inc." },
    { value: "globaltech", label: "GlobalTech Solutions" },
    { value: "metro", label: "Metro Events" },
    { value: "creative", label: "Creative Co." },
    { value: "new", label: "+ Add New Client" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add New Contact
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add a new contact to your address book
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
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
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              type="text"
              placeholder="Company name"
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="role">Role / Title</Label>
            <Input
              id="role"
              type="text"
              placeholder="CEO, Manager, etc."
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="client">Link to Client</Label>
          <Select
            options={clientOptions}
            placeholder="Select client (optional)"
            onChange={(value) => setFormData({ ...formData, client: value })}
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
            Add Contact
          </button>
        </div>
      </form>
    </Modal>
  );
};
