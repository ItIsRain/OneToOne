"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    type: "",
    startDate: "",
    dueDate: "",
    budget: "",
    description: "",
    priority: "",
  });

  const clientOptions = [
    { value: "acme", label: "Acme Corporation" },
    { value: "techstart", label: "TechStart Inc." },
    { value: "globaltech", label: "GlobalTech Solutions" },
    { value: "metro", label: "Metro Events" },
    { value: "creative", label: "Creative Co." },
  ];

  const projectTypeOptions = [
    { value: "website", label: "Website Development" },
    { value: "mobile-app", label: "Mobile App" },
    { value: "branding", label: "Branding & Identity" },
    { value: "marketing", label: "Marketing Campaign" },
    { value: "event", label: "Event Management" },
    { value: "consulting", label: "Consulting" },
    { value: "design", label: "Design Project" },
    { value: "other", label: "Other" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Project data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Create New Project
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up a new project for your team
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter project name"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

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
            <Label htmlFor="type">Project Type</Label>
            <Select
              options={projectTypeOptions}
              placeholder="Select type"
              onChange={(value) => setFormData({ ...formData, type: value })}
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
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="text"
              placeholder="$10,000"
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              options={priorityOptions}
              placeholder="Select priority"
              onChange={(value) => setFormData({ ...formData, priority: value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <TextArea
            placeholder="Describe the project goals and requirements..."
            onChange={(value) => setFormData({ ...formData, description: value })}
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
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
};
