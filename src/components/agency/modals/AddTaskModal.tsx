"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    event: "",
    priority: "",
    dueDate: "",
    assignee: "",
    description: "",
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

  const priorityOptions = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const assigneeOptions = [
    { value: "self", label: "Assign to me" },
    { value: "team-member-1", label: "John Smith" },
    { value: "team-member-2", label: "Sarah Johnson" },
    { value: "team-member-3", label: "Mike Chen" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Task data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add New Task
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create a task and assign it to an event
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="title">Task Title</Label>
          <Input
            id="title"
            type="text"
            placeholder="Enter task title"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            <Label htmlFor="priority">Priority</Label>
            <Select
              options={priorityOptions}
              placeholder="Select priority"
              onChange={(value) => setFormData({ ...formData, priority: value })}
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
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            options={assigneeOptions}
            placeholder="Assign to..."
            onChange={(value) => setFormData({ ...formData, assignee: value })}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <TextArea
            placeholder="Enter task details..."
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
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
