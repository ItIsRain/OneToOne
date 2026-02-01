"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import { AIFieldButton } from "@/components/ai/AIFieldButton";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultProjectId?: string;
}

interface Project {
  id: string;
  name: string;
  project_code: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
}) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const [formData, setFormData] = useState({
    // Required
    title: "",
    project_id: defaultProjectId || "",
    status: "todo",
    priority: "medium",

    // Recommended
    description: "",
    assigned_to: "",
    due_date: "",
    task_type: "task",
    estimated_hours: "",

    // Optional
    client_id: "",
    start_date: "",
    story_points: "",
    tags: "",
    category: "",
    complexity: "",
    billable: true,
    acceptance_criteria: "",
    internal_notes: "",
    external_url: "",
    git_branch: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      fetchClients();
      fetchProfiles();
      if (defaultProjectId) {
        setFormData((prev) => ({ ...prev, project_id: defaultProjectId }));
      }
    }
  }, [isOpen, defaultProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        const clientsArray = data.clients || data;
        if (Array.isArray(clientsArray)) {
          setClients(clientsArray);
        }
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProfiles(data);
        }
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const statusOptions = [
    { value: "backlog", label: "Backlog" },
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review", label: "In Review" },
    { value: "blocked", label: "Blocked" },
    { value: "completed", label: "Completed" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
    { value: "critical", label: "Critical" },
  ];

  const taskTypeOptions = [
    { value: "task", label: "Task" },
    { value: "feature", label: "Feature" },
    { value: "bug", label: "Bug" },
    { value: "improvement", label: "Improvement" },
    { value: "documentation", label: "Documentation" },
    { value: "research", label: "Research" },
    { value: "design", label: "Design" },
    { value: "testing", label: "Testing" },
    { value: "deployment", label: "Deployment" },
    { value: "meeting", label: "Meeting" },
    { value: "other", label: "Other" },
  ];

  const complexityOptions = [
    { value: "trivial", label: "Trivial" },
    { value: "simple", label: "Simple" },
    { value: "medium", label: "Medium" },
    { value: "complex", label: "Complex" },
    { value: "very_complex", label: "Very Complex" },
  ];

  const categoryOptions = [
    { value: "frontend", label: "Frontend" },
    { value: "backend", label: "Backend" },
    { value: "design", label: "Design" },
    { value: "qa", label: "QA" },
    { value: "devops", label: "DevOps" },
    { value: "documentation", label: "Documentation" },
    { value: "marketing", label: "Marketing" },
    { value: "support", label: "Support" },
    { value: "other", label: "Other" },
  ];

  const projectOptions = (projects || []).map((p) => ({
    value: p.id,
    label: `${p.project_code} - ${p.name}`,
  }));

  const clientOptions = (clients || []).map((c) => ({
    value: c.id,
    label: c.company || c.name,
  }));

  const profileOptions = (profiles || []).map((p) => ({
    value: p.id,
    label: `${p.first_name} ${p.last_name}`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        project_id: formData.project_id || null,
        client_id: formData.client_id || null,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
        start_date: formData.start_date || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        story_points: formData.story_points ? parseInt(formData.story_points) : null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        complexity: formData.complexity || null,
        category: formData.category || null,
        acceptance_criteria: formData.acceptance_criteria || null,
        internal_notes: formData.internal_notes || null,
        external_url: formData.external_url || null,
        git_branch: formData.git_branch || null,
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to create task");
        return;
      }

      // Reset form
      setFormData({
        title: "",
        project_id: defaultProjectId || "",
        status: "todo",
        priority: "medium",
        description: "",
        assigned_to: "",
        due_date: "",
        task_type: "task",
        estimated_hours: "",
        client_id: "",
        start_date: "",
        story_points: "",
        tags: "",
        category: "",
        complexity: "",
        billable: true,
        acceptance_criteria: "",
        internal_notes: "",
        external_url: "",
        git_branch: "",
      });
      setShowOptionalFields(false);

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6 lg:p-8">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add New Task
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create a task and assign it to a project
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
        {/* Required: Title */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="title">Task Title *</Label>
            <AIFieldButton
              module="tasks"
              field="title"
              currentValue={formData.title}
              context={{ task_type: formData.task_type, priority: formData.priority, category: formData.category }}
              onGenerate={(value) => setFormData({ ...formData, title: value })}
            />
          </div>
          <Input
            id="title"
            type="text"
            placeholder="Enter task title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        {/* Project & Type */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="project">Project</Label>
            <Select
              options={projectOptions}
              placeholder="Select project"
              value={formData.project_id}
              onChange={(value) => setFormData({ ...formData, project_id: value })}
            />
          </div>
          <div>
            <Label htmlFor="task_type">Task Type</Label>
            <Select
              options={taskTypeOptions}
              placeholder="Select type"
              value={formData.task_type}
              onChange={(value) => setFormData({ ...formData, task_type: value })}
            />
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              options={statusOptions}
              placeholder="Select status"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              options={priorityOptions}
              placeholder="Select priority"
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value })}
            />
          </div>
        </div>

        {/* Assignee & Due Date */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="assignee">Assignee</Label>
            <Select
              options={profileOptions}
              placeholder="Assign to..."
              value={formData.assigned_to}
              onChange={(value) => setFormData({ ...formData, assigned_to: value })}
            />
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>

        {/* Estimated Hours */}
        <div>
          <Label htmlFor="estimated_hours">Estimated Hours</Label>
          <Input
            id="estimated_hours"
            type="number"
            step={0.5}
            placeholder="e.g. 4"
            value={formData.estimated_hours}
            onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description</Label>
            <AIFieldButton
              module="tasks"
              field="description"
              currentValue={formData.description}
              context={{ title: formData.title, task_type: formData.task_type, priority: formData.priority, category: formData.category, due_date: formData.due_date }}
              onGenerate={(value) => setFormData({ ...formData, description: value })}
            />
          </div>
          <TextArea
            placeholder="Enter task details..."
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            rows={3}
          />
        </div>

        {/* Toggle Optional Fields */}
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
        >
          {showOptionalFields ? "Hide" : "Show"} Optional Fields
          <svg
            className={`h-4 w-4 transition-transform ${showOptionalFields ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="space-y-5 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            {/* Client & Start Date */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="client">Client</Label>
                <Select
                  options={clientOptions}
                  placeholder="Select client"
                  value={formData.client_id}
                  onChange={(value) => setFormData({ ...formData, client_id: value })}
                />
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
            </div>

            {/* Complexity & Story Points */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="complexity">Complexity</Label>
                <Select
                  options={complexityOptions}
                  placeholder="Select complexity"
                  value={formData.complexity}
                  onChange={(value) => setFormData({ ...formData, complexity: value })}
                />
              </div>
              <div>
                <Label htmlFor="story_points">Story Points</Label>
                <Input
                  id="story_points"
                  type="number"
                  placeholder="e.g. 3"
                  value={formData.story_points}
                  onChange={(e) => setFormData({ ...formData, story_points: e.target.value })}
                />
              </div>
            </div>

            {/* Category & Tags */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  options={categoryOptions}
                  placeholder="Select category"
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="ui, api, urgent"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>

            {/* Billable */}
            <div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.billable}
                  onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Billable Task</span>
              </label>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="acceptance_criteria">Acceptance Criteria</Label>
                <AIFieldButton
                  module="tasks"
                  field="acceptance_criteria"
                  currentValue={formData.acceptance_criteria}
                  context={{ title: formData.title, description: formData.description, task_type: formData.task_type }}
                  onGenerate={(value) => setFormData({ ...formData, acceptance_criteria: value })}
                />
              </div>
              <TextArea
                placeholder="Define what done looks like..."
                value={formData.acceptance_criteria}
                onChange={(value) => setFormData({ ...formData, acceptance_criteria: value })}
                rows={2}
              />
            </div>

            {/* External Links */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="external_url">External URL</Label>
                <Input
                  id="external_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="git_branch">Git Branch</Label>
                <Input
                  id="git_branch"
                  type="text"
                  placeholder="feature/task-name"
                  value={formData.git_branch}
                  onChange={(e) => setFormData({ ...formData, git_branch: e.target.value })}
                />
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="internal_notes">Internal Notes</Label>
                <AIFieldButton
                  module="tasks"
                  field="internal_notes"
                  currentValue={formData.internal_notes}
                  context={{ title: formData.title, description: formData.description, priority: formData.priority }}
                  onGenerate={(value) => setFormData({ ...formData, internal_notes: value })}
                />
              </div>
              <TextArea
                placeholder="Notes not visible to clients..."
                value={formData.internal_notes}
                onChange={(value) => setFormData({ ...formData, internal_notes: value })}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
