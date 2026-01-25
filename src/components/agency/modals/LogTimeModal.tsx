"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface LogTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const projects = [
  { value: "website-redesign", label: "Website Redesign" },
  { value: "mobile-app", label: "Mobile App" },
  { value: "ecommerce", label: "E-commerce Platform" },
  { value: "marketing-campaign", label: "Marketing Campaign" },
  { value: "annual-gala", label: "Annual Gala" },
];

const teamMembers = [
  { value: "alex", label: "Alex Johnson" },
  { value: "sarah", label: "Sarah Williams" },
  { value: "michael", label: "Michael Chen" },
  { value: "james", label: "James Wilson" },
  { value: "lisa", label: "Lisa Thompson" },
];

export function LogTimeModal({ isOpen, onClose }: LogTimeModalProps) {
  const [formData, setFormData] = useState({
    member: "",
    project: "",
    task: "",
    hours: "",
    minutes: "",
    date: "",
    description: "",
    billable: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Time entry data:", formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Log Time
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="member">Team Member</Label>
              <Select
                options={teamMembers}
                defaultValue={formData.member}
                onChange={(value) => setFormData({ ...formData, member: value })}
                placeholder="Select member"
              />
            </div>

            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                options={projects}
                defaultValue={formData.project}
                onChange={(value) => setFormData({ ...formData, project: value })}
                placeholder="Select project"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="task">Task</Label>
            <Input
              id="task"
              placeholder="What did you work on?"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="24"
                placeholder="0"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={formData.minutes}
                onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Describe what was accomplished..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={formData.billable}
              onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="billable" className="text-sm text-gray-600 dark:text-gray-400">
              Billable time
            </label>
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
              Log Time
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
