"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
}

interface Project {
  id: string;
  name: string;
  project_code: string | null;
}

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editContract?: {
    id: string;
    name: string;
    contract_type: string;
    category: string | null;
    client_id: string | null;
    project_id: string | null;
    value: number | null;
    currency: string;
    payment_terms: string | null;
    start_date: string | null;
    end_date: string | null;
    auto_renew: boolean;
    renewal_period: string | null;
    renewal_notice_days: number | null;
    status: string;
    signature_required: boolean;
    signatory_name: string | null;
    signatory_email: string | null;
    signatory_title: string | null;
    description: string | null;
    terms_and_conditions: string | null;
    special_clauses: string | null;
    internal_notes: string | null;
    reminder_enabled: boolean;
    reminder_days_before: number | null;
    tags: string[];
    deliverables: Array<{ name: string; description?: string }>;
    milestones: Array<{ name: string; date?: string; amount?: number }>;
  } | null;
}

const contractTypes = [
  { value: "service_agreement", label: "Service Agreement" },
  { value: "project_contract", label: "Project Contract" },
  { value: "retainer", label: "Retainer Agreement" },
  { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
  { value: "partnership", label: "Partnership Agreement" },
  { value: "employment", label: "Employment Contract" },
  { value: "vendor", label: "Vendor Agreement" },
  { value: "licensing", label: "Licensing Agreement" },
  { value: "other", label: "Other" },
];

const contractCategories = [
  { value: "client", label: "Client Contract" },
  { value: "vendor", label: "Vendor Contract" },
  { value: "partner", label: "Partner Contract" },
  { value: "internal", label: "Internal Agreement" },
  { value: "legal", label: "Legal Document" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "pending_signature", label: "Pending Signature" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
];

const paymentTermsOptions = [
  { value: "on_receipt", label: "Due on Receipt" },
  { value: "net_15", label: "Net 15 Days" },
  { value: "net_30", label: "Net 30 Days" },
  { value: "net_45", label: "Net 45 Days" },
  { value: "net_60", label: "Net 60 Days" },
  { value: "net_90", label: "Net 90 Days" },
  { value: "milestone", label: "Milestone-based" },
  { value: "custom", label: "Custom Terms" },
];

const renewalPeriodOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi_annual", label: "Semi-Annual" },
  { value: "annual", label: "Annual" },
  { value: "biennial", label: "Biennial (2 Years)" },
];

const currencies = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "AED", label: "AED - UAE Dirham" },
];

export function NewContractModal({ isOpen, onClose, onSuccess, editContract }: NewContractModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"basic" | "financial" | "parties" | "terms" | "advanced">("basic");

  const [formData, setFormData] = useState({
    name: "",
    contract_type: "service_agreement",
    category: "",
    client_id: "",
    project_id: "",
    value: "",
    currency: "USD",
    payment_terms: "",
    start_date: "",
    end_date: "",
    auto_renew: false,
    renewal_period: "",
    renewal_notice_days: "30",
    status: "draft",
    signature_required: true,
    signatory_name: "",
    signatory_email: "",
    signatory_title: "",
    description: "",
    terms_and_conditions: "",
    special_clauses: "",
    internal_notes: "",
    reminder_enabled: true,
    reminder_days_before: "30",
    tags: "",
    deliverables: [{ name: "", description: "" }],
    milestones: [{ name: "", date: "", amount: "" }],
  });

  // Fetch clients and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoadingClients(true);
      setLoadingProjects(true);
      try {
        const [clientsRes, projectsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/projects"),
        ]);

        const [clientsData, projectsData] = await Promise.all([
          clientsRes.json(),
          projectsRes.json(),
        ]);

        if (clientsRes.ok) {
          setClients(clientsData.clients || []);
        }
        if (projectsRes.ok) {
          setProjects(projectsData.projects || []);
        }
      } catch {
        console.error("Failed to fetch data");
      } finally {
        setLoadingClients(false);
        setLoadingProjects(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Initialize form with edit data
  useEffect(() => {
    if (isOpen && editContract) {
      setFormData({
        name: editContract.name || "",
        contract_type: editContract.contract_type || "service_agreement",
        category: editContract.category || "",
        client_id: editContract.client_id || "",
        project_id: editContract.project_id || "",
        value: editContract.value?.toString() || "",
        currency: editContract.currency || "USD",
        payment_terms: editContract.payment_terms || "",
        start_date: editContract.start_date?.split("T")[0] || "",
        end_date: editContract.end_date?.split("T")[0] || "",
        auto_renew: editContract.auto_renew || false,
        renewal_period: editContract.renewal_period || "",
        renewal_notice_days: editContract.renewal_notice_days?.toString() || "30",
        status: editContract.status || "draft",
        signature_required: editContract.signature_required !== false,
        signatory_name: editContract.signatory_name || "",
        signatory_email: editContract.signatory_email || "",
        signatory_title: editContract.signatory_title || "",
        description: editContract.description || "",
        terms_and_conditions: editContract.terms_and_conditions || "",
        special_clauses: editContract.special_clauses || "",
        internal_notes: editContract.internal_notes || "",
        reminder_enabled: editContract.reminder_enabled !== false,
        reminder_days_before: editContract.reminder_days_before?.toString() || "30",
        tags: editContract.tags?.join(", ") || "",
        deliverables: editContract.deliverables?.length > 0
          ? editContract.deliverables.map(d => ({ name: d.name, description: d.description || "" }))
          : [{ name: "", description: "" }],
        milestones: editContract.milestones?.length > 0
          ? editContract.milestones.map(m => ({ name: m.name, date: m.date || "", amount: m.amount?.toString() || "" }))
          : [{ name: "", date: "", amount: "" }],
      });
    } else if (isOpen) {
      // Reset form for new contract
      setFormData({
        name: "",
        contract_type: "service_agreement",
        category: "",
        client_id: "",
        project_id: "",
        value: "",
        currency: "USD",
        payment_terms: "",
        start_date: "",
        end_date: "",
        auto_renew: false,
        renewal_period: "",
        renewal_notice_days: "30",
        status: "draft",
        signature_required: true,
        signatory_name: "",
        signatory_email: "",
        signatory_title: "",
        description: "",
        terms_and_conditions: "",
        special_clauses: "",
        internal_notes: "",
        reminder_enabled: true,
        reminder_days_before: "30",
        tags: "",
        deliverables: [{ name: "", description: "" }],
        milestones: [{ name: "", date: "", amount: "" }],
      });
      setActiveTab("basic");
    }
    setError("");
  }, [isOpen, editContract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Prepare data
      const tags = formData.tags.split(",").map(t => t.trim()).filter(t => t.length > 0);
      const deliverables = formData.deliverables.filter(d => d.name.trim().length > 0);
      const milestones = formData.milestones.filter(m => m.name.trim().length > 0).map(m => ({
        name: m.name,
        date: m.date || null,
        amount: m.amount ? parseFloat(m.amount) : null,
      }));

      const payload = {
        name: formData.name,
        contract_type: formData.contract_type,
        category: formData.category || null,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        value: formData.value ? parseFloat(formData.value) : null,
        currency: formData.currency,
        payment_terms: formData.payment_terms || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        auto_renew: formData.auto_renew,
        renewal_period: formData.renewal_period || null,
        renewal_notice_days: formData.renewal_notice_days ? parseInt(formData.renewal_notice_days) : 30,
        status: formData.status,
        signature_required: formData.signature_required,
        signatory_name: formData.signatory_name || null,
        signatory_email: formData.signatory_email || null,
        signatory_title: formData.signatory_title || null,
        description: formData.description || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        special_clauses: formData.special_clauses || null,
        internal_notes: formData.internal_notes || null,
        reminder_enabled: formData.reminder_enabled,
        reminder_days_before: formData.reminder_days_before ? parseInt(formData.reminder_days_before) : 30,
        tags,
        deliverables,
        milestones,
      };

      const url = editContract
        ? `/api/documents/contracts/${editContract.id}`
        : "/api/documents/contracts";
      const method = editContract ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save contract");
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const addDeliverable = () => {
    setFormData({
      ...formData,
      deliverables: [...formData.deliverables, { name: "", description: "" }],
    });
  };

  const removeDeliverable = (index: number) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((_, i) => i !== index),
    });
  };

  const updateDeliverable = (index: number, field: "name" | "description", value: string) => {
    const newDeliverables = [...formData.deliverables];
    newDeliverables[index][field] = value;
    setFormData({ ...formData, deliverables: newDeliverables });
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { name: "", date: "", amount: "" }],
    });
  };

  const removeMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    });
  };

  const updateMilestone = (index: number, field: "name" | "date" | "amount", value: string) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index][field] = value;
    setFormData({ ...formData, milestones: newMilestones });
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "financial", label: "Financial" },
    { id: "parties", label: "Parties" },
    { id: "terms", label: "Terms" },
    { id: "advanced", label: "Advanced" },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          {editContract ? "Edit Contract" : "New Contract"}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="contractName">Contract Name *</Label>
                <Input
                  id="contractName"
                  placeholder="e.g., Service Agreement - Acme Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Contract Type *</Label>
                  <Select
                    options={contractTypes}
                    defaultValue={formData.contract_type}
                    onChange={(value) => setFormData({ ...formData, contract_type: value })}
                    placeholder="Select type"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    options={contractCategories}
                    defaultValue={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    placeholder="Select category"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Client</Label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    disabled={submitting || loadingClients}
                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="project">Project</Label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    disabled={submitting || loadingProjects}
                    className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} {project.project_code ? `(${project.project_code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  options={statusOptions}
                  defaultValue={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value })}
                  placeholder="Select status"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="Brief description of the contract..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === "financial" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Contract Value</Label>
                  <Input
                    id="value"
                    type="number"
                    step={0.01}
                    placeholder="0.00"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    options={currencies}
                    defaultValue={formData.currency}
                    onChange={(value) => setFormData({ ...formData, currency: value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select
                  options={paymentTermsOptions}
                  defaultValue={formData.payment_terms}
                  onChange={(value) => setFormData({ ...formData, payment_terms: value })}
                  placeholder="Select payment terms"
                  disabled={submitting}
                />
              </div>

              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Payment Milestones</Label>
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                  >
                    + Add Milestone
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.milestones.map((milestone, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Milestone name"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(index, "name", e.target.value)}
                          disabled={submitting}
                        />
                        <Input
                          type="date"
                          placeholder="Date"
                          value={milestone.date}
                          onChange={(e) => updateMilestone(index, "date", e.target.value)}
                          disabled={submitting}
                        />
                        <Input
                          type="number"
                          step={0.01}
                          placeholder="Amount"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      {formData.milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="p-1 text-gray-400 hover:text-error-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-Renewal */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={formData.auto_renew}
                    onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    disabled={submitting}
                  />
                  <label htmlFor="autoRenew" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Auto-Renewal
                  </label>
                </div>

                {formData.auto_renew && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label htmlFor="renewalPeriod">Renewal Period</Label>
                      <Select
                        options={renewalPeriodOptions}
                        defaultValue={formData.renewal_period}
                        onChange={(value) => setFormData({ ...formData, renewal_period: value })}
                        placeholder="Select period"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="renewalNoticeDays">Notice Days Before</Label>
                      <Input
                        id="renewalNoticeDays"
                        type="number"
                        placeholder="30"
                        value={formData.renewal_notice_days}
                        onChange={(e) => setFormData({ ...formData, renewal_notice_days: e.target.value })}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === "parties" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="signatureRequired"
                  checked={formData.signature_required}
                  onChange={(e) => setFormData({ ...formData, signature_required: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  disabled={submitting}
                />
                <label htmlFor="signatureRequired" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Signature Required
                </label>
              </div>

              {formData.signature_required && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Signatory Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signatoryName">Name</Label>
                      <Input
                        id="signatoryName"
                        placeholder="Full name"
                        value={formData.signatory_name}
                        onChange={(e) => setFormData({ ...formData, signatory_name: e.target.value })}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="signatoryTitle">Title/Position</Label>
                      <Input
                        id="signatoryTitle"
                        placeholder="e.g., CEO, Director"
                        value={formData.signatory_title}
                        onChange={(e) => setFormData({ ...formData, signatory_title: e.target.value })}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signatoryEmail">Email</Label>
                    <Input
                      id="signatoryEmail"
                      type="email"
                      placeholder="signatory@example.com"
                      value={formData.signatory_email}
                      onChange={(e) => setFormData({ ...formData, signatory_email: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {/* Deliverables */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Deliverables</Label>
                  <button
                    type="button"
                    onClick={addDeliverable}
                    className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                  >
                    + Add Deliverable
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.deliverables.map((deliverable, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Deliverable name"
                          value={deliverable.name}
                          onChange={(e) => updateDeliverable(index, "name", e.target.value)}
                          disabled={submitting}
                        />
                        <Input
                          placeholder="Description (optional)"
                          value={deliverable.description}
                          onChange={(e) => updateDeliverable(index, "description", e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      {formData.deliverables.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDeliverable(index)}
                          className="p-1 text-gray-400 hover:text-error-500 mt-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Terms Tab */}
          {activeTab === "terms" && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                <textarea
                  id="termsAndConditions"
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="Enter the full terms and conditions..."
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="specialClauses">Special Clauses</Label>
                <textarea
                  id="specialClauses"
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="Any special clauses or amendments..."
                  value={formData.special_clauses}
                  onChange={(e) => setFormData({ ...formData, special_clauses: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-5">
              {/* Reminders */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={formData.reminder_enabled}
                    onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    disabled={submitting}
                  />
                  <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Expiry Reminders
                  </label>
                </div>

                {formData.reminder_enabled && (
                  <div className="pl-6">
                    <Label htmlFor="reminderDaysBefore">Days Before Expiry</Label>
                    <Input
                      id="reminderDaysBefore"
                      type="number"
                      placeholder="30"
                      value={formData.reminder_days_before}
                      onChange={(e) => setFormData({ ...formData, reminder_days_before: e.target.value })}
                      disabled={submitting}
                      className="max-w-[150px]"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <textarea
                  id="internalNotes"
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  placeholder="Internal notes (not visible on contract)..."
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.name}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : editContract ? "Update Contract" : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
