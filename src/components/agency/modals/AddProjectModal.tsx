"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Required fields
    name: "",
    client_id: "",
    project_type: "",
    status: "planning",
    priority: "medium",
    start_date: "",
    end_date: "",
    project_manager_id: "",

    // Recommended fields
    description: "",
    budget_amount: "",
    billing_type: "fixed_price",
    estimated_hours: "",

    // Financial Details
    hourly_rate: "",
    estimated_cost: "",
    budget_currency: "USD",
    payment_terms: "net_30",

    // Team & Assignment
    team_lead_id: "",
    department: "",

    // Scope & Requirements
    scope_summary: "",
    requirements: "",
    out_of_scope: "",

    // External Links
    repository_url: "",
    staging_url: "",
    production_url: "",
    figma_url: "",
    drive_folder_url: "",

    // Contract & Legal
    contract_signed: false,
    nda_required: false,

    // Other
    visibility: "team",
    color: "#6366f1",
    tags: "",
    industry: "",
    category: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchProfiles();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        // API returns { clients: [...] }
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

  const projectTypeOptions = [
    { value: "website", label: "Website Development" },
    { value: "mobile_app", label: "Mobile App" },
    { value: "branding", label: "Branding & Identity" },
    { value: "marketing_campaign", label: "Marketing Campaign" },
    { value: "social_media", label: "Social Media" },
    { value: "event_management", label: "Event Management" },
    { value: "consulting", label: "Consulting" },
    { value: "design", label: "Design Project" },
    { value: "video_production", label: "Video Production" },
    { value: "content_creation", label: "Content Creation" },
    { value: "seo", label: "SEO & Analytics" },
    { value: "other", label: "Other" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "planning", label: "Planning" },
    { value: "in_progress", label: "In Progress" },
    { value: "on_hold", label: "On Hold" },
    { value: "review", label: "Review" },
    { value: "completed", label: "Completed" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  const billingTypeOptions = [
    { value: "fixed_price", label: "Fixed Price" },
    { value: "hourly", label: "Hourly" },
    { value: "retainer", label: "Retainer" },
    { value: "milestone_based", label: "Milestone Based" },
    { value: "time_and_materials", label: "Time & Materials" },
  ];

  const paymentTermsOptions = [
    { value: "upon_receipt", label: "Upon Receipt" },
    { value: "net_15", label: "Net 15" },
    { value: "net_30", label: "Net 30" },
    { value: "net_45", label: "Net 45" },
    { value: "net_60", label: "Net 60" },
    { value: "upon_completion", label: "Upon Completion" },
    { value: "milestone_based", label: "Milestone Based" },
  ];

  const visibilityOptions = [
    { value: "private", label: "Private (Only you)" },
    { value: "team", label: "Team (Internal)" },
    { value: "client_visible", label: "Client Visible" },
  ];

  const departmentOptions = [
    { value: "development", label: "Development" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "operations", label: "Operations" },
    { value: "creative", label: "Creative" },
    { value: "content", label: "Content" },
  ];

  const currencyOptions = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (\u20ac)" },
    { value: "GBP", label: "GBP (\u00a3)" },
    { value: "AED", label: "AED" },
    { value: "INR", label: "INR (\u20b9)" },
    { value: "CAD", label: "CAD ($)" },
    { value: "AUD", label: "AUD ($)" },
  ];

  const industryOptions = [
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "retail", label: "Retail" },
    { value: "education", label: "Education" },
    { value: "real_estate", label: "Real Estate" },
    { value: "hospitality", label: "Hospitality" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "entertainment", label: "Entertainment" },
    { value: "nonprofit", label: "Non-Profit" },
    { value: "other", label: "Other" },
  ];

  const categoryOptions = [
    { value: "development", label: "Development" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
    { value: "consulting", label: "Consulting" },
    { value: "support", label: "Support" },
    { value: "strategy", label: "Strategy" },
    { value: "research", label: "Research" },
  ];

  const colorOptions = [
    "#6366f1", // Indigo
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#14b8a6", // Teal
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
  ];

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
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        client_id: formData.client_id || null,
        project_manager_id: formData.project_manager_id || null,
        team_lead_id: formData.team_lead_id || null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }

      // Reset form
      setFormData({
        name: "",
        client_id: "",
        project_type: "",
        status: "planning",
        priority: "medium",
        start_date: "",
        end_date: "",
        project_manager_id: "",
        description: "",
        budget_amount: "",
        billing_type: "fixed_price",
        estimated_hours: "",
        hourly_rate: "",
        estimated_cost: "",
        budget_currency: "USD",
        payment_terms: "net_30",
        team_lead_id: "",
        department: "",
        scope_summary: "",
        requirements: "",
        out_of_scope: "",
        repository_url: "",
        staging_url: "",
        production_url: "",
        figma_url: "",
        drive_folder_url: "",
        contract_signed: false,
        nda_required: false,
        visibility: "team",
        color: "#6366f1",
        tags: "",
        industry: "",
        category: "",
      });
      setShowOptionalFields(false);
      setActiveSection(null);

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {title}
      <svg
        className={`h-5 w-5 transition-transform ${activeSection === section ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Create New Project
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up a new project for your team
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
        {/* Required Fields */}
        <div>
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter project name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

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
            <Label htmlFor="project_type">Project Type *</Label>
            <Select
              options={projectTypeOptions}
              placeholder="Select type"
              value={formData.project_type}
              onChange={(value) => setFormData({ ...formData, project_type: value })}
            />
          </div>
        </div>

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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="end_date">Due Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="project_manager">Project Manager</Label>
          <Select
            options={profileOptions}
            placeholder="Select project manager"
            value={formData.project_manager_id}
            onChange={(value) => setFormData({ ...formData, project_manager_id: value })}
          />
        </div>

        {/* Recommended Fields */}
        <div>
          <Label htmlFor="description">Description</Label>
          <TextArea
            placeholder="Describe the project goals and requirements..."
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              placeholder="10000"
              value={formData.budget_amount}
              onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="billing_type">Billing Type</Label>
            <Select
              options={billingTypeOptions}
              placeholder="Select billing"
              value={formData.billing_type}
              onChange={(value) => setFormData({ ...formData, billing_type: value })}
            />
          </div>
          <div>
            <Label htmlFor="estimated_hours">Est. Hours</Label>
            <Input
              id="estimated_hours"
              type="number"
              placeholder="100"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
            />
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <Label>Project Color</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  formData.color === color
                    ? "border-gray-800 scale-110 dark:border-white"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
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

        {/* Optional Fields Sections */}
        {showOptionalFields && (
          <div className="space-y-3">
            {/* Financial Details */}
            <SectionHeader title="Financial Details" section="financial" />
            {activeSection === "financial" && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      options={currencyOptions}
                      value={formData.budget_currency}
                      onChange={(value) => setFormData({ ...formData, budget_currency: value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select
                      options={paymentTermsOptions}
                      value={formData.payment_terms}
                      onChange={(value) => setFormData({ ...formData, payment_terms: value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      placeholder="150"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_cost">Estimated Cost</Label>
                    <Input
                      id="estimated_cost"
                      type="number"
                      placeholder="8000"
                      value={formData.estimated_cost}
                      onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Team & Assignment */}
            <SectionHeader title="Team & Assignment" section="team" />
            {activeSection === "team" && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="team_lead">Team Lead</Label>
                    <Select
                      options={profileOptions}
                      placeholder="Select team lead"
                      value={formData.team_lead_id}
                      onChange={(value) => setFormData({ ...formData, team_lead_id: value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                      options={departmentOptions}
                      placeholder="Select department"
                      value={formData.department}
                      onChange={(value) => setFormData({ ...formData, department: value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Scope & Requirements */}
            <SectionHeader title="Scope & Requirements" section="scope" />
            {activeSection === "scope" && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div>
                  <Label htmlFor="scope_summary">Scope Summary</Label>
                  <TextArea
                    placeholder="Brief overview of project scope..."
                    value={formData.scope_summary}
                    onChange={(value) => setFormData({ ...formData, scope_summary: value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="requirements">Requirements</Label>
                  <TextArea
                    placeholder="Detailed requirements..."
                    value={formData.requirements}
                    onChange={(value) => setFormData({ ...formData, requirements: value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="out_of_scope">Out of Scope</Label>
                  <TextArea
                    placeholder="What's explicitly not included..."
                    value={formData.out_of_scope}
                    onChange={(value) => setFormData({ ...formData, out_of_scope: value })}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* External Links */}
            <SectionHeader title="External Links" section="links" />
            {activeSection === "links" && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="repository_url">Repository URL</Label>
                    <Input
                      id="repository_url"
                      type="url"
                      placeholder="https://github.com/..."
                      value={formData.repository_url}
                      onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="figma_url">Figma URL</Label>
                    <Input
                      id="figma_url"
                      type="url"
                      placeholder="https://figma.com/..."
                      value={formData.figma_url}
                      onChange={(e) => setFormData({ ...formData, figma_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="staging_url">Staging URL</Label>
                    <Input
                      id="staging_url"
                      type="url"
                      placeholder="https://staging.example.com"
                      value={formData.staging_url}
                      onChange={(e) => setFormData({ ...formData, staging_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="production_url">Production URL</Label>
                    <Input
                      id="production_url"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.production_url}
                      onChange={(e) => setFormData({ ...formData, production_url: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="drive_folder_url">Drive/Docs Folder</Label>
                  <Input
                    id="drive_folder_url"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formData.drive_folder_url}
                    onChange={(e) => setFormData({ ...formData, drive_folder_url: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Contract & Legal */}
            <SectionHeader title="Contract & Legal" section="contract" />
            {activeSection === "contract" && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.contract_signed}
                      onChange={(e) => setFormData({ ...formData, contract_signed: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Contract Signed</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.nda_required}
                      onChange={(e) => setFormData({ ...formData, nda_required: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">NDA Required</span>
                  </label>
                </div>
              </div>
            )}

            {/* Categorization */}
            <SectionHeader title="Categorization & Tags" section="tags" />
            {activeSection === "tags" && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      options={industryOptions}
                      placeholder="Select industry"
                      value={formData.industry}
                      onChange={(value) => setFormData({ ...formData, industry: value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    options={visibilityOptions}
                    value={formData.visibility}
                    onChange={(value) => setFormData({ ...formData, visibility: value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    type="text"
                    placeholder="react, nextjs, e-commerce"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>
            )}
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
            disabled={loading || !formData.name}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
