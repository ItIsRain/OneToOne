"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface ProposalTemplate {
  id: string;
  name: string;
  description: string | null;
}

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (proposal: any) => void;
}

export const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, leadsRes, templatesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/leads"),
          fetch("/api/proposals/templates"),
        ]);

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
        }

        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(data.leads || []);
        }

        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.templates || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    if (isOpen) {
      fetchData();
      setTitle("");
      setClientId("");
      setLeadId("");
      setTemplateId("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a proposal title");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          client_id: clientId || null,
          lead_id: leadId || null,
          template_id: templateId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create proposal");
      }

      onCreated(data.proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create proposal");
    } finally {
      setIsSaving(false);
    }
  };

  const selectClassName =
    "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6 lg:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Create Proposal
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Start a new proposal for a client or lead
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <Label htmlFor="proposal-title">Proposal Title</Label>
          <input
            id="proposal-title"
            type="text"
            placeholder="e.g., Website Redesign Proposal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        {/* Client */}
        <div>
          <Label htmlFor="proposal-client">Client (Optional)</Label>
          <select
            id="proposal-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={selectClassName}
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.company ? ` - ${client.company}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Lead */}
        <div>
          <Label htmlFor="proposal-lead">Lead (Optional)</Label>
          <select
            id="proposal-lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className={selectClassName}
          >
            <option value="">Select a lead</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name}
                {lead.company ? ` - ${lead.company}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Template */}
        <div>
          <Label htmlFor="proposal-template">Template (Optional)</Label>
          <select
            id="proposal-template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className={selectClassName}
          >
            <option value="">Start from scratch</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.description ? ` - ${template.description}` : ""}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-error-500">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {isSaving ? "Creating..." : "Create Proposal"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProposalModal;
