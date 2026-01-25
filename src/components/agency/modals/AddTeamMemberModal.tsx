"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    startDate: "",
    employmentType: "",
  });

  const departmentOptions = [
    { value: "operations", label: "Operations" },
    { value: "creative", label: "Creative" },
    { value: "technology", label: "Technology" },
    { value: "sales", label: "Sales" },
    { value: "marketing", label: "Marketing" },
    { value: "events", label: "Events" },
    { value: "finance", label: "Finance" },
    { value: "hr", label: "Human Resources" },
  ];

  const employmentTypeOptions = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contractor", label: "Contractor" },
    { value: "intern", label: "Intern" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Team member data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add Team Member
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add a new member to your team
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
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
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
            <Label htmlFor="role">Job Title</Label>
            <Input
              id="role"
              type="text"
              placeholder="Project Manager"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select
              options={departmentOptions}
              placeholder="Select department"
              onChange={(value) => setFormData({ ...formData, department: value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select
              options={employmentTypeOptions}
              placeholder="Select type"
              onChange={(value) => setFormData({ ...formData, employmentType: value })}
            />
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            An invitation email will be sent to the new team member with instructions to set up their account.
          </p>
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
            Send Invitation
          </button>
        </div>
      </form>
    </Modal>
  );
};
